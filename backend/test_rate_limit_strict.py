#!/usr/bin/env python3
"""
Strict rate limiting test
"""
import requests
import time

BASE_URL = "http://localhost:8000"

def test_rate_limit():
    """Make rapid requests to trigger rate limiting"""
    print("🔒 Testing Rate Limiting (Strict Mode)")
    print("="*60)
    
    # Test on a non-health endpoint that we know exists
    endpoint = "/"
    
    print(f"Making 65 rapid requests to {endpoint}...")
    
    success = []
    rate_limited = []
    
    start = time.time()
    
    for i in range(65):
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            
            if response.status_code == 429:
                rate_limited.append(i+1)
                if len(rate_limited) == 1:
                    print(f"\n❌ RATE LIMITED at request {i+1}")
                    print(f"   Status: {response.status_code}")
                    detail = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                    print(f"   Detail: {detail}")
            else:
                success.append(response.status_code)
            
            # Small delay to not overwhelm
            time.sleep(0.01)
            
        except Exception as e:
            print(f"Error on request {i+1}: {e}")
    
    elapsed = time.time() - start
    
    print(f"\n⏱️  Completed in {elapsed:.2f}s")
    print(f"📊 Total requests: 65")
    print(f"✅ Successful: {len(success)}")
    print(f"❌ Rate limited: {len(rate_limited)}")
    
    if rate_limited:
        print(f"\n✅ Rate limiting IS WORKING!")
        print(f"   First rate limit at request #{rate_limited[0]}")
        return True
    else:
        print(f"\n⚠️  No rate limit triggered")
        print(f"   This means rate limiting is not being applied to this endpoint")
        return False

if __name__ == "__main__":
    test_rate_limit()

