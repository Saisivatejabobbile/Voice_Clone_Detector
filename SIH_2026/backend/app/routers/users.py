"""
Users Router
Handles user-related operations (profile, contacts, online users)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.schemas.user import UserResponse
from app.schemas.contact import ContactCreate, ContactResponse
from app.schemas.settings import PasswordChangeRequest, PasswordChangeResponse, UserSettingsUpdate
from app.auth.dependencies import get_current_active_user
from app.auth.security import get_password_hash, verify_password

router = APIRouter()


@router.get("/online", response_model=List[UserResponse])
async def get_online_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of online users
    
    Returns all users who are currently online (excluding current user)
    """
    online_users = db.query(User).filter(
        User.is_online == True,
        User.id != current_user.id,
        User.is_active == True
    ).all()
    
    return online_users


@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user's contacts with registration status
    
    Returns all contacts for the current user with online status if registered
    """
    contacts = db.query(Contact).filter(
        Contact.user_id == current_user.id
    ).all()
    
    # Enrich contacts with registration and online status
    enriched_contacts = []
    for contact in contacts:
        contact_dict = contact.to_dict()
        
        # Check if contact is a registered user
        if contact.contact_user_id:
            registered_user = db.query(User).filter(User.id == contact.contact_user_id).first()
            if registered_user:
                contact_dict['is_registered'] = True
                contact_dict['is_online'] = registered_user.is_online
            else:
                contact_dict['is_registered'] = False
                contact_dict['is_online'] = False
        else:
            # Try to find user by email
            user_by_email = db.query(User).filter(User.email == contact.contact_email).first()
            if user_by_email:
                contact.contact_user_id = user_by_email.id
                db.commit()
                contact_dict['contact_user_id'] = user_by_email.id
                contact_dict['is_registered'] = True
                contact_dict['is_online'] = user_by_email.is_online
            else:
                contact_dict['is_registered'] = False
                contact_dict['is_online'] = False
        
        enriched_contacts.append(ContactResponse(**contact_dict))
    
    return enriched_contacts


@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def add_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a new contact
    
    Creates a new contact for the current user
    """
    # Check if contact already exists
    existing_contact = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_email == contact_data.contact_email
    ).first()
    
    if existing_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact with this email already exists"
        )
    
    # Check if contact email is a registered user
    registered_user = db.query(User).filter(User.email == contact_data.contact_email).first()
    
    # Create new contact
    new_contact = Contact(
        user_id=current_user.id,
        contact_name=contact_data.contact_name,
        contact_email=contact_data.contact_email,
        contact_user_id=registered_user.id if registered_user else None
    )
    
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    
    # Prepare response with registration status
    contact_dict = new_contact.to_dict()
    contact_dict['is_registered'] = registered_user is not None
    contact_dict['is_online'] = registered_user.is_online if registered_user else False
    
    return ContactResponse(**contact_dict)


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a contact
    
    Removes a contact from the current user's contact list
    """
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    db.delete(contact)
    db.commit()
    
    return None


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user by ID
    
    Returns user profile information for specified user_id
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user




@router.put("/me/password", response_model=PasswordChangeResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Change user password
    
    Requires current password for verification
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return PasswordChangeResponse(message="Password changed successfully")
@router.put("/me", response_model=UserResponse)
async def update_profile(
    full_name: str = None,
    phone: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user's profile
    
    Allows updating full_name and phone number
    """
    if full_name:
        current_user.full_name = full_name
    if phone:
        current_user.phone = phone
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/me/status")
async def update_online_status(
    is_online: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update user's online status
    
    - **is_online**: True for online, False for offline
    """
    current_user.is_online = is_online
    if not is_online:
        current_user.last_seen = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Status updated",
        "is_online": is_online
    }


