# Chat Functionality Troubleshooting Guide

## 🚀 Quick Setup

If you're having issues with the chat functionality, follow these steps:

### 1. **Configure API Key (Required)**

The chat functionality requires an OpenAI API key to work. Here are the easiest ways to set it up:

#### **Option A: Use the Setup Script (Recommended)**
```bash
npm run setup:env
```

#### **Option B: Manual Setup**
1. Create a `.env.local` file in your project root
2. Add your OpenAI API key:
```env
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
VITE_OPENAI_MODEL=gpt-4o
VITE_OPENAI_EMBED_MODEL=text-embedding-3-large
```

#### **Option C: Use the App's Built-in Setup**
1. Open the diagnostic modal in the app
2. Click "Configure API Key"
3. Follow the setup instructions

### 2. **Get an OpenAI API Key**

If you don't have an API key:
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

## 🔍 Common Issues & Solutions

### **Issue: "No AI provider available"**

**Symptoms:**
- Chat shows error message about no AI provider
- No response when asking questions

**Solutions:**
1. ✅ **Configure API Key** (see Quick Setup above)
2. ✅ **Check API Key Format**: Should start with `sk-` and be ~51 characters
3. ✅ **Verify API Key Validity**: Use the diagnostic modal to test
4. ✅ **Ensure Account Has Credits**: Check your OpenAI account balance

### **Issue: "API Key Not Found" or "Invalid API Key"**

**Symptoms:**
- Error message about invalid API key
- 401 status code errors

**Solutions:**
1. ✅ **Check API Key**: Ensure it's copied correctly without extra spaces
2. ✅ **Regenerate API Key**: Create a new key on OpenAI platform
3. ✅ **Check Account Status**: Ensure your OpenAI account is active
4. ✅ **Verify Permissions**: Make sure the key has chat completion permissions

### **Issue: "Insufficient Credits"**

**Symptoms:**
- Error about insufficient credits
- 402 status code errors

**Solutions:**
1. ✅ **Add Credits**: Visit [OpenAI Billing](https://platform.openai.com/account/billing)
2. ✅ **Check Usage**: Monitor your API usage
3. ✅ **Use Free Credits**: New accounts get free credits
4. ✅ **Optimize Usage**: Use shorter prompts or different models

### **Issue: "Rate Limit Exceeded"**

**Symptoms:**
- Error about rate limits
- 429 status code errors

**Solutions:**
1. ✅ **Wait and Retry**: Rate limits reset automatically
2. ✅ **Reduce Frequency**: Don't send too many requests quickly
3. ✅ **Upgrade Plan**: Consider upgrading your OpenAI plan
4. ✅ **Use Different Model**: Try gpt-3.5-turbo instead of gpt-4o

### **Issue: "Network Connection Issue"**

**Symptoms:**
- Connection timeout errors
- Network-related error messages

**Solutions:**
1. ✅ **Check Internet**: Ensure stable internet connection
2. ✅ **Check Firewall**: Allow connections to api.openai.com
3. ✅ **Try Different Network**: Switch to different WiFi/mobile
4. ✅ **Check Proxy/VPN**: Disable if causing issues

### **Issue: "Chat Not Responding"**

**Symptoms:**
- Chat appears to hang
- No response after sending message

**Solutions:**
1. ✅ **Check Loading State**: Look for "Thinking..." message
2. ✅ **Wait Longer**: Some responses take time to generate
3. ✅ **Refresh Page**: Reload the application
4. ✅ **Check Console**: Look for JavaScript errors
5. ✅ **Restart Dev Server**: Run `npm run dev` again

### **Issue: "No Relevant Answers"**

**Symptoms:**
- AI responds but answers aren't relevant
- Generic responses instead of contextual ones

**Solutions:**
1. ✅ **Select Links**: Make sure you've selected research links
2. ✅ **Check Link Content**: Ensure links have readable content
3. ✅ **Improve Prompts**: Be more specific in your questions
4. ✅ **Add Context**: Mention specific aspects you want analyzed
5. ✅ **Check Summaries**: Ensure links have been processed

## 🛠️ Advanced Troubleshooting

### **Diagnostic Tools**

Use the built-in diagnostic modal:
1. Click the settings icon in the app
2. Select "Diagnostics"
3. Review all test results
4. Follow recommendations

### **Environment Variables**

Check your environment variables:
```bash
echo "VITE_OPENAI_API_KEY: ${VITE_OPENAI_API_KEY:-'not set'}"
echo "VITE_OPENAI_MODEL: ${VITE_OPENAI_MODEL:-'not set'}"
```

### **Browser Console**

Check for errors:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

### **API Testing**

Test your API key directly:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models
```

## 📋 Checklist

Before reporting issues, ensure:

- [ ] OpenAI API key is configured
- [ ] API key is valid and has credits
- [ ] Internet connection is stable
- [ ] No firewall/proxy blocking requests
- [ ] Links are selected for chat
- [ ] Links have readable content
- [ ] Browser console shows no errors
- [ ] Diagnostic modal shows all green checks

## 🆘 Getting Help

If you're still having issues:

1. **Check the Console**: Look for specific error messages
2. **Use Diagnostics**: Run the diagnostic modal
3. **Check Logs**: Review browser console and network logs
4. **Test API Key**: Verify it works with OpenAI directly
5. **Try Different Browser**: Test in incognito/private mode

## 🎯 Best Practices

### **For Better Chat Experience:**

1. **Select Relevant Links**: Choose links related to your question
2. **Be Specific**: Ask detailed, specific questions
3. **Use Context**: Reference specific parts of your research
4. **Follow Up**: Ask clarifying questions if needed
5. **Use Quick Prompts**: Try the built-in prompt templates

### **For API Usage:**

1. **Monitor Usage**: Keep track of your API consumption
2. **Use Appropriate Models**: Choose models based on your needs
3. **Optimize Prompts**: Keep prompts concise but informative
4. **Batch Questions**: Group related questions together
5. **Save Important Responses**: Copy important answers for reference

---

**Need more help?** Check the main troubleshooting guide or open an issue with specific error messages and steps to reproduce. 