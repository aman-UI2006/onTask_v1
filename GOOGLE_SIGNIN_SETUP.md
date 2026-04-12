# 🔐 Google Sign-In Setup Guide

## Current Status
✅ **Code Implementation**: Complete and working  
⚠️ **Firebase Configuration**: Needs manual setup

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Enable Google Sign-In in Firebase Console

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Your Project**
   - Click on: **ai-project-manager-6ea2b**

3. **Navigate to Authentication**
   - Left sidebar → Click **"Authentication"**
   - If prompted, click **"Get Started"**

4. **Enable Google Sign-In**
   - Click on **"Sign-in method"** tab at the top
   - Scroll down to find **"Google"** provider
   - Click on **"Google"**
   - Toggle the **"Enable"** switch to ON (blue)
   - Select your **project support email** from dropdown
   - Click **"Save"**

---

### Step 2: Verify Authorized Domains

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"** section
3. Make sure these domains are listed:
   - ✅ `localhost`
   - ✅ `ai-project-manager-6ea2b.firebaseapp.com`
   - ✅ `ai-project-manager-6ea2b.web.app`

4. If `localhost` is missing:
   - Click **"Add domain"**
   - Type: `localhost`
   - Click **"Add"**

---

### Step 3: Configure OAuth Consent Screen (Google Cloud)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Make sure project **ai-project-manager-6ea2b** is selected

2. **Navigate to OAuth Consent**
   - Left menu → **APIs & Services** → **OAuth consent screen**
   - Or visit: https://console.cloud.google.com/apis/credentials/consent

3. **Check Configuration**
   - If it shows **"External"** user type → that's fine
   - If it shows **"Testing"** mode:
     - Scroll to **"Test users"** section
     - Click **"Add users"**
     - Add your Gmail address
     - Click **"Save"**

4. **Publish App** (Optional for production)
   - Click **"Publish app"** button when ready
   - This makes it available to all Google users

---

### Step 4: Test Google Sign-In

1. **Start your application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open the app**
   - Visit: http://localhost:5173 (or the port shown)
   - Click **"Login"** button
   - Click **"Continue with Google"** button

3. **Expected Behavior**
   - Google popup should appear
   - Select your Google account
   - Should redirect to dashboard/tasks page

---

## 🐛 Troubleshooting

### Error: "Google Sign-In is not configured for this domain"
**Solution**: Add `localhost` to authorized domains in Firebase Console (Step 2)

### Error: "Popup was blocked by browser"
**Solution**: 
- Click the popup icon in browser address bar
- Select "Always allow popups from localhost"

### Error: "Authentication service is not configured"
**Solution**: Backend Firebase Admin is not initialized properly
- Check that `FIREBASE_PROJECT_ID=ai-project-manager-6ea2b` is in backend/.env
- Restart backend server

### Error: "An account already exists with different sign-in method"
**Solution**: 
- User registered with email/password first
- Use email/password login instead, OR
- Delete the user from Firebase Console and try Google again

### Google popup closes immediately
**Solutions**:
1. Check browser console for errors (F12)
2. Verify Firebase config in frontend/.env is correct
3. Make sure Google provider is enabled in Firebase Console

---

## ✅ Verification Checklist

- [ ] Google provider enabled in Firebase Console
- [ ] `localhost` in authorized domains
- [ ] OAuth consent screen configured
- [ ] Test user added (if in testing mode)
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Browser allows popups for localhost
- [ ] No console errors in browser (F12)

---

## 🔒 Security Notes

- The Firebase config in frontend/.env is **safe to expose**
- These values only identify your project
- Actual authentication happens via secure Google OAuth
- Backend verifies all tokens before granting access

---

## 📞 Need Help?

If you encounter any issues:
1. Check browser console (F12) for error messages
2. Check backend terminal for error logs
3. Verify all steps above are completed
4. The error messages shown on login page are now detailed and will tell you exactly what's wrong

---

**Last Updated**: 2026-04-10
