# VoiceShield User Guide

## Getting Started

### What is VoiceShield?

VoiceShield is a real-time voice call authentication system that detects AI-generated synthetic voices during phone calls. It helps protect you from voice cloning scams and deepfake fraud.

---

## Making Your First Call

### 1. Register & Login

1. Open VoiceShield in your browser
2. Click **Sign Up** and create an account
3. Login with your credentials

### 2. Check User Status

On the Dashboard, you'll see a list of registered users. Look for the status indicator next to each name:

- 🟢 **Green dot** = User is online and available
- ⚫ **Gray dot** = User is offline

**You can only call users who are online (green dot).**

### 3. Initiate a Call

1. Find an online user in the list
2. Click the **📞 Call** button next to their name
3. Allow microphone access when prompted (required for calls)

### 4. Receiving Calls

When someone calls you:
1. You'll see an **Incoming Call** modal with the caller's name
2. A ringtone will play (you may need to interact with the page first due to browser autoplay policies)
3. Click **Accept** to answer or **Reject** to decline

---

## During a Call

### Call Interface

Once connected, you'll see:

**Top Section: Caller Information**
- Caller's name and email
- Call duration timer
- Connection status

**Middle Section: Risk Dashboard**
- Real-time risk level indicator
- Risk score (0-100)
- Synthetic voice confidence percentage
- Acoustic and prosody indicators

**Bottom Section: Call Controls**
- 🎤 **Mute/Unmute** button
- 📞 **End Call** button

### Understanding Risk Levels

VoiceShield analyzes the incoming voice in real-time and displays three risk levels:

#### 🟢 LOW RISK (0-30)
**What it means:** Voice appears natural and authentic

**Indicators:**
- Risk Score: 0-30%
- Synthetic Confidence: < 30%
- Background: Green

**Recommendation:** ✅ **SAFE** - Continue the call normally

**Example:**
```
Risk Score: 15%
Synthetic Confidence: 12%
Model Confidence: 88%
```

---

#### 🟡 MEDIUM RISK (31-70)
**What it means:** Some suspicious voice characteristics detected

**Indicators:**
- Risk Score: 31-70%
- Synthetic Confidence: 31-70%
- Background: Yellow

**Recommendation:** ⚠️ **CAUTION** - Be alert and verify caller identity

**Actions to take:**
1. Ask personal questions only the real person would know
2. Verify through a different channel (text, email)
3. Don't share sensitive information yet
4. Monitor if risk increases

**Example:**
```
Risk Score: 55%
Synthetic Confidence: 48%
Model Confidence: 75%
Acoustic Indicators: Some spectral anomalies
Prosody Indicators: Rhythm inconsistencies
```

---

#### 🔴 HIGH RISK (71-100)
**What it means:** Strong evidence of AI-generated voice

**Indicators:**
- Risk Score: 71-100%
- Synthetic Confidence: > 70%
- Background: Red

**Recommendation:** 🚨 **TERMINATE** - End the call immediately

**Actions to take:**
1. **End the call** using the End Call button
2. **Do NOT share** any personal or financial information
3. **Report** the incident if it's a scam attempt
4. **Verify** the caller through official channels if needed

**Example:**
```
Risk Score: 92%
Synthetic Confidence: 88%
Model Confidence: 91%
Acoustic Indicators: High spectral anomalies, harmonic distortion
Prosody Indicators: Unnatural rhythm, robotic pitch
```

---

## Risk Dashboard Explained

### Main Metrics

**1. Risk Score (0-100)**
- Overall assessment combining all indicators
- Higher = more likely synthetic voice
- Updates every 1-2 seconds

**2. Synthetic Confidence (%)**
- AI model's confidence that voice is synthetic
- Based on deep learning analysis
- Most reliable indicator

**3. Model Confidence (%)**
- How certain the AI model is about its prediction
- Low confidence = inconclusive results
- High confidence = reliable prediction

### Technical Indicators

**Acoustic Indicators:**
- **Spectral Anomaly:** Unusual frequency patterns (synthetic voices have unnatural harmonics)
- **Harmonic Distortion:** Audio artifacts from voice synthesis

**Prosody Indicators:**
- **Rhythm Consistency:** Natural speech has variable rhythm; AI voices are too consistent
- **Pitch Naturalness:** Human voices have micro-variations; AI voices are smoother

**What to watch for:**
- Multiple high indicators = stronger evidence
- Sudden spikes in risk score = concerning
- Consistently low scores = likely authentic

---

## Call Controls

### Mute/Unmute 🎤
- Click to mute your microphone
- Other party won't hear you
- Icon changes to 🔇 when muted
- Risk analysis continues

### End Call 📞
- Terminates the call immediately
- Closes WebRTC connection
- Call record is saved to history
- Redirects to Dashboard

---

## Call History

Access your call history from the Dashboard:

1. Click **Call History** in the navigation
2. View all past calls with:
   - Participant name
   - Call date & time
   - Duration
   - Final risk level (color-coded)
   - Risk score

**Color coding:**
- 🟢 Green = Safe call (Low risk)
- 🟡 Yellow = Suspicious call (Medium risk)
- 🔴 Red = Dangerous call (High risk)

**Use cases:**
- Review previous calls
- Check if a past caller was flagged
- Export records for reporting

---

## Best Practices

### For Callers
1. **Test your microphone** before important calls
2. **Use a quiet environment** for better audio quality
3. **Speak clearly** for accurate analysis
4. **Monitor risk levels** throughout the call

### For Security
1. **Never ignore HIGH RISK warnings**
2. **Verify caller identity** on MEDIUM RISK
3. **Don't share sensitive info** if risk is elevated
4. **Report suspicious calls** to authorities
5. **Use alternative verification** when in doubt

### For Technical Quality
1. **Use a stable internet connection**
2. **Close unnecessary browser tabs**
3. **Grant microphone permissions**
4. **Use supported browsers** (Chrome, Firefox, Edge, Safari)

---

## Troubleshooting

### Can't hear ringtone
**Solution:** Interact with the page (click anywhere) before receiving calls. Browsers block autoplay audio until user interaction.

### Microphone not working
**Solutions:**
1. Check browser permissions (click lock icon in address bar)
2. Ensure no other app is using the microphone
3. Try refreshing the page
4. Check system microphone settings

### Connection failed
**Solutions:**
1. Check your internet connection
2. Verify the other user is online
3. Refresh the page and try again
4. Check firewall settings

### Risk dashboard not updating
**Solutions:**
1. Check if audio is streaming (look at call timer)
2. Verify other party is speaking
3. Check browser console for errors
4. Reconnect the call

### User shows offline but is online
**Solutions:**
1. Refresh the Dashboard
2. Check internet connection
3. Ask user to logout and login again

---

## Privacy & Security

### What data is collected?
- Call metadata (participants, duration, timestamp)
- Audio analysis results (risk scores, indicators)
- **Note:** Raw audio is NOT stored permanently

### How is data protected?
- All connections use secure WebSocket (WSS) over HTTPS
- JWT authentication for all API calls
- Database encryption at rest
- No third-party data sharing

### Can others see my calls?
- No, call history is private to your account
- Only call participants can see risk analysis

---

## Browser Compatibility

### Fully Supported ✅
- Chrome 100+
- Firefox 100+
- Edge 100+
- Safari 15+

### Not Supported ❌
- Internet Explorer
- Older browsers without WebRTC

**Check compatibility:** VoiceShield will show a warning if your browser is not supported.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `M` | Mute/Unmute (during call) |
| `H` | Hangup/End Call |
| `Esc` | Reject incoming call |
| `Enter` | Accept incoming call |

---

## FAQs

**Q: How accurate is the voice analysis?**
A: The AI model has 85-95% accuracy depending on voice quality and synthesis method. Always use human judgment in addition to the risk score.

**Q: Does VoiceShield work with phone calls?**
A: Currently, VoiceShield is a web-based application for browser-to-browser calls. Phone integration may come in future versions.

**Q: Can I use VoiceShield on mobile?**
A: Yes, but ensure you're using a supported mobile browser (Chrome, Safari). The interface is responsive.

**Q: What if I get a false positive?**
A: False positives can occur with poor audio quality or unusual accents. Use the MEDIUM risk as "caution" rather than absolute proof.

**Q: Can attackers bypass VoiceShield?**
A: Advanced voice cloning might reduce detection accuracy, but the system is continuously updated. Always verify caller identity through multiple channels for sensitive matters.

**Q: Is VoiceShield free?**
A: Check with your organization's deployment for pricing and licensing.

---

## Support

**Technical Issues:**
- Check browser console for errors
- Review troubleshooting section
- Contact: support@voiceshield.example.com

**Security Concerns:**
- Report suspicious activity immediately
- Contact: security@voiceshield.example.com

**Feedback:**
- Share suggestions and bug reports
- Contact: feedback@voiceshield.example.com

---

## Quick Reference Card

### 🎯 Risk Levels at a Glance

| Level | Score | Color | Action |
|-------|-------|-------|--------|
| LOW | 0-30 | 🟢 Green | Continue normally |
| MEDIUM | 31-70 | 🟡 Yellow | Verify caller identity |
| HIGH | 71-100 | 🔴 Red | End call immediately |

### 🔑 Key Indicators

- **Synthetic Confidence > 70%** = Likely AI voice
- **Multiple high acoustic/prosody indicators** = Suspicious
- **Model Confidence < 50%** = Inconclusive, use caution

### 📞 Emergency Actions

1. See HIGH RISK → Click "End Call"
2. Don't share personal/financial info
3. Verify through alternative channel
4. Report if scam attempt

---

**Stay safe with VoiceShield! 🛡️**
