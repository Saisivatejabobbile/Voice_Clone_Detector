"""
Blockchain Integrity & Tamper-Evident Audit Engine
Provides cryptographic proof-of-authenticity for voice fraud detection events.
Enforces:
1. Canonical SHA-256 event hashing
2. Off-chain raw metadata storage with on-chain cryptographic commitment
3. Tamper-evident hash-chained blockchain blocks
4. Verification utility confirming off-chain record authenticity against on-chain ledger proof
"""

import os
import json
import time
import hashlib
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger(__name__)


class BlockchainBlock:
    """
    Cryptographically chained block in the VoiceShield Audit Ledger.
    """

    def __init__(
        self,
        index: int,
        timestamp: str,
        call_id: str,
        window_id: int,
        mapped_status: str,
        deterministic_audit_hash: str,
        raw_ml_hash: str,
        previous_hash: str,
        nonce: int = 0
    ):
        self.index = index
        self.timestamp = timestamp
        self.call_id = call_id
        self.window_id = window_id
        self.mapped_status = mapped_status
        self.deterministic_audit_hash = deterministic_audit_hash
        self.raw_ml_hash = raw_ml_hash
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.block_hash = self.compute_hash()
        self.tx_hash = self.compute_tx_hash()

    def compute_hash(self) -> str:
        """Calculate SHA-256 header hash for the block."""
        block_string = (
            f"{self.index}|{self.timestamp}|{self.call_id}|{self.window_id}|"
            f"{self.mapped_status}|{self.deterministic_audit_hash}|"
            f"{self.raw_ml_hash}|{self.previous_hash}|{self.nonce}"
        )
        return hashlib.sha256(block_string.encode('utf-8')).hexdigest()

    def compute_tx_hash(self) -> str:
        """Calculate deterministic transaction hash."""
        tx_string = f"TX:{self.call_id}:{self.window_id}:{self.deterministic_audit_hash}:{self.timestamp}"
        return "0x" + hashlib.sha256(tx_string.encode('utf-8')).hexdigest()

    def mine_block(self, difficulty: int = 2) -> None:
        """Lightweight proof-of-work mining satisfying target leading zeros."""
        target = "0" * difficulty
        while not self.block_hash.startswith(target):
            self.nonce += 1
            self.block_hash = self.compute_hash()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "call_id": self.call_id,
            "window_id": self.window_id,
            "mapped_status": self.mapped_status,
            "deterministic_audit_hash": self.deterministic_audit_hash,
            "raw_ml_hash": self.raw_ml_hash,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "block_hash": self.block_hash,
            "tx_hash": self.tx_hash
        }


class BlockchainAuditService:
    """
    Tamper-evident audit service.
    Maintains the append-only cryptographic ledger file and validates records.
    """

    def __init__(
        self,
        ledger_path: Optional[str] = None,
        difficulty: Optional[int] = None
    ):
        self.ledger_path = ledger_path or getattr(settings, 'BLOCKCHAIN_LEDGER_PATH', './data/blockchain_ledger.json')
        self.difficulty = difficulty if difficulty is not None else getattr(settings, 'BLOCKCHAIN_DIFFICULTY', 2)
        self.chain: List[BlockchainBlock] = []
        self._load_or_initialize_ledger()

    def _load_or_initialize_ledger(self) -> None:
        """Load blockchain from disk or create genesis block."""
        os.makedirs(os.path.dirname(self.ledger_path), exist_ok=True)
        if os.path.exists(self.ledger_path):
            try:
                with open(self.ledger_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for item in data:
                        block = BlockchainBlock(
                            index=item["index"],
                            timestamp=item["timestamp"],
                            call_id=item["call_id"],
                            window_id=item["window_id"],
                            mapped_status=item["mapped_status"],
                            deterministic_audit_hash=item["deterministic_audit_hash"],
                            raw_ml_hash=item["raw_ml_hash"],
                            previous_hash=item["previous_hash"],
                            nonce=item.get("nonce", 0)
                        )
                        block.block_hash = item.get("block_hash", block.compute_hash())
                        block.tx_hash = item.get("tx_hash", block.compute_tx_hash())
                        self.chain.append(block)
                logger.info(f"BlockchainAuditService: Loaded {len(self.chain)} blocks from {self.ledger_path}")
                return
            except Exception as e:
                logger.error(f"Failed to read ledger from {self.ledger_path}, recreating genesis: {e}")

        # Create Genesis Block
        genesis = BlockchainBlock(
            index=0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            call_id="GENESIS",
            window_id=0,
            mapped_status="SYSTEM_ROOT",
            deterministic_audit_hash="0" * 64,
            raw_ml_hash="0" * 64,
            previous_hash="0" * 64,
            nonce=0
        )
        genesis.mine_block(self.difficulty)
        self.chain = [genesis]
        self._save_ledger()
        logger.info("BlockchainAuditService: Created Genesis block.")

    def _save_ledger(self) -> None:
        """Persist blockchain to JSON storage."""
        try:
            with open(self.ledger_path, 'w', encoding='utf-8') as f:
                json.dump([b.to_dict() for b in self.chain], f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist blockchain ledger: {e}")

    @staticmethod
    def compute_raw_json_hash(raw_ml_json: Any) -> str:
        """Generate SHA-256 hash of raw ML response payload."""
        canonical_raw = json.dumps(raw_ml_json, sort_keys=True)
        return hashlib.sha256(canonical_raw.encode('utf-8')).hexdigest()

    @staticmethod
    def generate_canonical_string(
        call_id: str,
        window_id: int,
        timestamp: str,
        mapped_status: str,
        confidence: float,
        risk_level: str,
        language: str,
        raw_ml_json_hash: str
    ) -> str:
        """
        Deterministic canonical audit string strictly following Section 17:
        canonical_string = "CALL:" + call_id + "|WINDOW:" + window_id + "|TIME:" + timestamp + "|STATUS:" + mapped_status + "|CONF:" + confidence + "|RISK:" + risk_level + "|LANG:" + language + "|RAW_HASH:" + raw_ml_json_hash
        """
        return (
            f"CALL:{call_id}|"
            f"WINDOW:{window_id}|"
            f"TIME:{timestamp}|"
            f"STATUS:{mapped_status}|"
            f"CONF:{confidence}|"
            f"RISK:{risk_level}|"
            f"LANG:{language}|"
            f"RAW_HASH:{raw_ml_json_hash}"
        )

    @classmethod
    def generate_audit_hash(
        cls,
        call_id: str,
        window_id: int,
        timestamp: str,
        mapped_status: str,
        confidence: float,
        risk_level: str,
        language: str,
        raw_ml_json_hash: str
    ) -> Tuple[str, str]:
        """
        Generate (canonical_string, deterministic_audit_hash).
        """
        canonical_str = cls.generate_canonical_string(
            call_id=call_id,
            window_id=window_id,
            timestamp=timestamp,
            mapped_status=mapped_status,
            confidence=confidence,
            risk_level=risk_level,
            language=language,
            raw_ml_json_hash=raw_ml_json_hash
        )
        audit_hash = hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()
        return canonical_str, audit_hash

    def commit_audit_record(
        self,
        call_id: str,
        window_id: int,
        mapped_status: str,
        confidence: float,
        risk_level: str,
        language: str,
        raw_ml_json: Dict[str, Any],
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Record a tamper-evident audit record on the blockchain ledger.
        
        Args:
            call_id: Unique call identifier
            window_id: Sequential window index
            mapped_status: REAL | CLONED VOICE | UNCERTAIN | INSUFFICIENT AUDIO
            confidence: Confidence score percentage
            risk_level: HIGH | MEDIUM | LOW
            language: Detected language
            raw_ml_json: Full un-truncated raw ML JSON response
            timestamp: Optional ISO timestamp
            
        Returns:
            dict containing tx_hash, block_number, audit_hash, block_hash, verified status
        """
        ts = timestamp or datetime.now(timezone.utc).isoformat()
        raw_ml_hash = self.compute_raw_json_hash(raw_ml_json)
        canonical_str, audit_hash = self.generate_audit_hash(
            call_id=call_id,
            window_id=window_id,
            timestamp=ts,
            mapped_status=mapped_status,
            confidence=confidence,
            risk_level=risk_level,
            language=language,
            raw_ml_json_hash=raw_ml_hash
        )

        previous_block = self.chain[-1]
        new_block = BlockchainBlock(
            index=len(self.chain),
            timestamp=ts,
            call_id=call_id,
            window_id=window_id,
            mapped_status=mapped_status,
            deterministic_audit_hash=audit_hash,
            raw_ml_hash=raw_ml_hash,
            previous_hash=previous_block.block_hash,
            nonce=0
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        self._save_ledger()

        logger.info(
            f"BlockchainAuditService: Block #{new_block.index} COMMITTED for call {call_id} "
            f"(tx={new_block.tx_hash[:16]}..., audit_hash={audit_hash[:16]}...)"
        )

        return {
            "verified": True,
            "block_number": new_block.index,
            "tx_hash": new_block.tx_hash,
            "audit_hash": audit_hash,
            "raw_ml_hash": raw_ml_hash,
            "block_hash": new_block.block_hash,
            "canonical_string": canonical_str,
            "timestamp": ts
        }

    def verify_record(
        self,
        call_id: str,
        window_id: int,
        timestamp: str,
        mapped_status: str,
        confidence: float,
        risk_level: str,
        language: str,
        raw_ml_json: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Tamper-Verification Function (Section 17.5).
        Re-computes canonical hash from input data and checks against the on-chain block.
        
        Returns:
            dict: {"is_valid": bool, "tampered": bool, "details": str, ...}
        """
        # Find matching block on chain (search newest first)
        matching_block = None
        for block in reversed(self.chain):
            if block.call_id == call_id and block.window_id == window_id:
                matching_block = block
                break

        if not matching_block:
            return {
                "is_valid": False,
                "tampered": False,
                "reason": f"No block found on ledger for call {call_id} window {window_id}"
            }

        # Re-compute hashes
        computed_raw_hash = self.compute_raw_json_hash(raw_ml_json)
        canonical_str, computed_audit_hash = self.generate_audit_hash(
            call_id=call_id,
            window_id=window_id,
            timestamp=timestamp,
            mapped_status=mapped_status,
            confidence=confidence,
            risk_level=risk_level,
            language=language,
            raw_ml_json_hash=computed_raw_hash
        )

        # Check equality
        hash_matches = (computed_audit_hash == matching_block.deterministic_audit_hash)
        raw_matches = (computed_raw_hash == matching_block.raw_ml_hash)
        block_hash_valid = (matching_block.block_hash == matching_block.compute_hash())

        is_authentic = hash_matches and raw_matches and block_hash_valid

        return {
            "verified": is_authentic,
            "is_valid": is_authentic,
            "tampered": not is_authentic,
            "block_number": matching_block.index,
            "tx_hash": matching_block.tx_hash,
            "on_chain_audit_hash": matching_block.deterministic_audit_hash,
            "computed_audit_hash": computed_audit_hash,
            "hash_matches": hash_matches,
            "block_hash_valid": block_hash_valid
        }

    def get_audit_trail_for_call(self, call_id: str) -> List[Dict[str, Any]]:
        """Retrieve all confirmed blockchain ledger records for a call session."""
        return [b.to_dict() for b in self.chain if b.call_id == call_id]

    def verify_ledger_integrity(self) -> Tuple[bool, Optional[str]]:
        """Verify the entire blockchain for cryptographic tampering or broken chain links."""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            if current.previous_hash != prev.block_hash:
                return False, f"Broken chain link at block #{current.index}: prev_hash mismatch"
            if current.block_hash != current.compute_hash():
                return False, f"Tampered block hash at block #{current.index}"

        return True, "Blockchain ledger integrity verified: zero tampering detected"


# Singleton instance
_blockchain_service_instance: Optional[BlockchainAuditService] = None

def get_blockchain_audit_service() -> BlockchainAuditService:
    """Get or create singleton BlockchainAuditService."""
    global _blockchain_service_instance
    if _blockchain_service_instance is None:
        _blockchain_service_instance = BlockchainAuditService()
    return _blockchain_service_instance
