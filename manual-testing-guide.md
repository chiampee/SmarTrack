# 🧪 Manual Testing Guide - Enhanced Onboarding

## Overview
This guide will help you manually test all the enhanced onboarding functionality in the browser.

## Prerequisites
- Development server running (`npm run dev`)
- Browser with developer tools open
- Test API key (optional)

## 🚀 Test Steps

### 1. **Welcome Step**
**Expected Behavior:**
- ✅ Smooth fade-in animation
- ✅ Progress bar shows 25% (1 of 4 steps)
- ✅ Welcome message with gradient background
- ✅ "Get Started" button works
- ✅ Auto-advance to next step

**Test Actions:**
1. Open the app in browser
2. Trigger onboarding modal (if not auto-shown)
3. Verify animations and progress
4. Click "Get Started" or wait for auto-advance

### 2. **Extension Installation Step**
**Expected Behavior:**
- ✅ Progress bar shows 50% (2 of 4 steps)
- ✅ Auto-detection runs after 1 second
- ✅ "Check" button for manual detection
- ✅ Extension download links work
- ✅ Installation instructions are clear
- ✅ Tips and features sections animate in

**Test Actions:**
1. Wait for auto-detection (should show "No extension found")
2. Click "Check" button manually
3. Verify download links open in new tab
4. Check that installation instructions are clear
5. Verify tips and features sections appear with animations

### 3. **AI Setup Step**
**Expected Behavior:**
- ✅ Progress bar shows 75% (3 of 4 steps)
- ✅ "Skip for now" button visible
- ✅ API key input with visual validation
- ✅ Enter key saves API key
- ✅ Test button validates API key
- ✅ Auto-save if test is successful
- ✅ Auto-advance after successful setup

**Test Actions:**
1. **Test Skip Functionality:**
   - Click "Skip for now"
   - Should show success message and auto-advance

2. **Test API Key Validation:**
   - Enter empty key → Should show validation error
   - Enter invalid key → Should show yellow indicator
   - Enter valid format → Should show green indicator

3. **Test Enter Key:**
   - Enter a valid API key format
   - Press Enter → Should trigger save

4. **Test Test Button:**
   - Enter a test API key
   - Click "Test" → Should validate and show result
   - If successful → Should auto-save and advance

### 4. **Completion Step**
**Expected Behavior:**
- ✅ Progress bar shows 100% (4 of 4 steps)
- ✅ Success hero with animations
- ✅ Setup summary with 3 cards
- ✅ Quick actions section
- ✅ Keyboard shortcuts display
- ✅ Final call to action

**Test Actions:**
1. Verify all animations play correctly
2. Check setup summary shows correct status
3. Verify quick actions are listed
4. Check keyboard shortcuts are displayed
5. Click "Get Started" to close modal

## 🎯 Key Functional Tests

### **Auto-Detection Test**
1. Navigate to extension step
2. Wait 1 second for auto-detection
3. Should show detection result
4. If extension found → Should auto-advance

### **Skip Functionality Test**
1. On AI setup step
2. Click "Skip for now"
3. Should show success message
4. Should auto-advance to next step

### **API Key Auto-Save Test**
1. Enter valid API key format
2. Click "Test" button
3. If test successful → Should auto-save
4. Should auto-advance after 1.5 seconds

### **Progress Tracking Test**
1. Navigate through all steps
2. Verify progress bar updates correctly:
   - Step 1: 25%
   - Step 2: 50%
   - Step 3: 75%
   - Step 4: 100%

### **Animation Timing Test**
1. Open modal → Progress should appear after 300ms
2. Change steps → Step content should animate after 100ms
3. Auto-detection → Should run after 1000ms
4. Auto-advance → Should trigger after 1500ms

## 🐛 Error Handling Tests

### **API Key Errors**
1. Enter invalid API key
2. Click "Test" → Should show error message
3. Click "Setup" → Should show error message
4. Verify error messages are helpful

### **Extension Detection Errors**
1. Click "Check" button
2. If no extension → Should show appropriate message
3. If network error → Should handle gracefully

### **Network Errors**
1. Disconnect internet
2. Try API key test → Should show network error
3. Verify error message is clear

## ⌨️ Keyboard Shortcut Tests

### **Enter Key Test**
1. Focus on API key input
2. Enter valid API key
3. Press Enter → Should save and advance

### **Escape Key Test**
1. Open onboarding modal
2. Press Escape → Should close modal

### **Tab Navigation Test**
1. Use Tab to navigate through form elements
2. Verify focus order is logical
3. Check that all interactive elements are accessible

## 📱 Responsive Design Tests

### **Mobile View**
1. Resize browser to mobile width
2. Verify all elements are properly sized
3. Check that buttons are touch-friendly
4. Verify text is readable

### **Tablet View**
1. Resize browser to tablet width
2. Verify layout adapts correctly
3. Check that animations still work
4. Verify progress bar is visible

## 🎨 Visual Design Tests

### **Animation Smoothness**
1. Navigate through all steps
2. Verify animations are smooth (60fps)
3. Check that no stuttering occurs
4. Verify loading states are smooth

### **Color and Contrast**
1. Verify all text is readable
2. Check that success/error states are clear
3. Verify progress bar colors are distinct
4. Check that focus states are visible

## 🔧 Browser Compatibility Tests

### **Chrome**
1. Test all functionality in Chrome
2. Verify extension detection works
3. Check that all animations work

### **Firefox**
1. Test all functionality in Firefox
2. Verify fallback behavior for Chrome APIs
3. Check that animations work

### **Safari**
1. Test all functionality in Safari
2. Verify fallback behavior for Chrome APIs
3. Check that animations work

## 📊 Performance Tests

### **Loading Performance**
1. Open onboarding modal
2. Time how long animations take
3. Verify no lag or stuttering
4. Check memory usage

### **Animation Performance**
1. Navigate through steps rapidly
2. Verify animations don't queue up
3. Check that transitions are smooth
4. Verify no memory leaks

## ✅ Success Criteria

All tests should pass with:
- ✅ Smooth animations (no stuttering)
- ✅ Proper error handling
- ✅ Auto-detection working
- ✅ Skip functionality working
- ✅ Progress tracking accurate
- ✅ Keyboard shortcuts working
- ✅ Responsive design working
- ✅ All browsers compatible
- ✅ Performance acceptable

## 🐛 Known Issues

If you encounter any issues:
1. Check browser console for errors
2. Verify network connectivity
3. Check that all dependencies are loaded
4. Verify API endpoints are accessible

## 📝 Test Results Template

```
Test Date: _______________
Browser: _______________
Version: _______________

✅ Welcome Step: Pass/Fail
✅ Extension Step: Pass/Fail
✅ AI Setup Step: Pass/Fail
✅ Completion Step: Pass/Fail

✅ Auto-Detection: Pass/Fail
✅ Skip Functionality: Pass/Fail
✅ API Key Validation: Pass/Fail
✅ Progress Tracking: Pass/Fail
✅ Animations: Pass/Fail
✅ Responsive Design: Pass/Fail

Issues Found:
- _______________
- _______________

Overall Result: ✅ PASS / ❌ FAIL
```

## 🚀 Ready for Production

Once all tests pass:
1. ✅ Enhanced onboarding is functional
2. ✅ User experience is smooth
3. ✅ Error handling is robust
4. ✅ Performance is acceptable
5. ✅ Ready for user testing 