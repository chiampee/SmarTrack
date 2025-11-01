"""
Test script to verify refactored code imports and functionality
"""

import sys
import traceback

def test_imports():
    """Test that all refactored modules can be imported"""
    print("=" * 60)
    print("Testing Imports")
    print("=" * 60)
    
    tests_passed = 0
    tests_failed = 0
    
    # Test utility imports
    try:
        from utils import (
            validate_object_id,
            normalize_document,
            normalize_documents,
            build_user_filter,
            build_pagination_query,
            validate_url,
            sanitize_string,
            validate_title,
            validate_description,
            validate_tags,
            NotFoundError,
            ValidationError,
            DuplicateError
        )
        print("✅ Utility imports successful")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Utility imports failed: {e}")
        traceback.print_exc()
        tests_failed += 1
        return False
    
    # Test API imports
    try:
        from api import links, collections, categories
        print("✅ API module imports successful")
        tests_passed += 1
    except Exception as e:
        print(f"❌ API module imports failed: {e}")
        traceback.print_exc()
        tests_failed += 1
        return False
    
    print(f"\n✅ Import tests: {tests_passed} passed, {tests_failed} failed\n")
    return tests_failed == 0


def test_utility_functions():
    """Test utility function functionality"""
    print("=" * 60)
    print("Testing Utility Functions")
    print("=" * 60)
    
    tests_passed = 0
    tests_failed = 0
    
    try:
        from utils.validation import validate_url, validate_title, validate_tags
        from utils.mongodb_utils import build_user_filter, build_search_filter
        
        # Test URL validation
        try:
            valid_url = validate_url("https://example.com", "URL")
            assert valid_url == "https://example.com"
            print("✅ URL validation works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ URL validation failed: {e}")
            tests_failed += 1
        
        # Test invalid URL
        try:
            try:
                validate_url("not-a-url", "URL")
                print("❌ Invalid URL was accepted (should have failed)")
                tests_failed += 1
            except Exception:
                print("✅ Invalid URL correctly rejected")
                tests_passed += 1
        except Exception as e:
            print(f"❌ URL validation error handling failed: {e}")
            tests_failed += 1
        
        # Test title validation
        try:
            valid_title = validate_title("Test Title", max_length=500)
            assert valid_title == "Test Title"
            print("✅ Title validation works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ Title validation failed: {e}")
            tests_failed += 1
        
        # Test empty title rejection
        try:
            try:
                validate_title("", allow_empty=False)
                print("❌ Empty title was accepted (should have failed)")
                tests_failed += 1
            except Exception:
                print("✅ Empty title correctly rejected")
                tests_passed += 1
        except Exception as e:
            print(f"❌ Title validation error handling failed: {e}")
            tests_failed += 1
        
        # Test tags validation
        try:
            valid_tags = validate_tags(["tag1", "tag2"], max_count=50)
            assert len(valid_tags) == 2
            print("✅ Tags validation works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ Tags validation failed: {e}")
            tests_failed += 1
        
        # Test build_user_filter
        try:
            filter_query = build_user_filter("user123")
            assert filter_query == {"userId": "user123"}
            print("✅ build_user_filter works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ build_user_filter failed: {e}")
            tests_failed += 1
        
        # Test build_search_filter
        try:
            search_filter = build_search_filter("test", ["title", "description"])
            assert "$or" in search_filter
            print("✅ build_search_filter works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ build_search_filter failed: {e}")
            tests_failed += 1
        
    except Exception as e:
        print(f"❌ Utility function tests failed: {e}")
        traceback.print_exc()
        tests_failed += 1
    
    print(f"\n✅ Utility function tests: {tests_passed} passed, {tests_failed} failed\n")
    return tests_failed == 0


def test_error_classes():
    """Test custom error classes"""
    print("=" * 60)
    print("Testing Error Classes")
    print("=" * 60)
    
    tests_passed = 0
    tests_failed = 0
    
    try:
        from utils.errors import NotFoundError, ValidationError, DuplicateError
        from fastapi import HTTPException
        
        # Test NotFoundError
        try:
            error = NotFoundError("Link", "123")
            assert isinstance(error, HTTPException)
            assert error.status_code == 404
            assert "Link" in error.detail
            print("✅ NotFoundError works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ NotFoundError failed: {e}")
            tests_failed += 1
        
        # Test ValidationError
        try:
            error = ValidationError("Invalid input")
            assert isinstance(error, HTTPException)
            assert error.status_code == 400
            assert "Invalid input" in error.detail
            print("✅ ValidationError works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ ValidationError failed: {e}")
            tests_failed += 1
        
        # Test DuplicateError
        try:
            error = DuplicateError("Link", "https://example.com")
            assert isinstance(error, HTTPException)
            assert error.status_code == 409
            assert "Link" in error.detail
            print("✅ DuplicateError works")
            tests_passed += 1
        except Exception as e:
            print(f"❌ DuplicateError failed: {e}")
            tests_failed += 1
        
    except Exception as e:
        print(f"❌ Error class tests failed: {e}")
        traceback.print_exc()
        tests_failed += 1
    
    print(f"\n✅ Error class tests: {tests_passed} passed, {tests_failed} failed\n")
    return tests_failed == 0


def test_api_routes_import():
    """Test that API routes can be imported and have required functions"""
    print("=" * 60)
    print("Testing API Routes")
    print("=" * 60)
    
    tests_passed = 0
    tests_failed = 0
    
    try:
        # Test links router
        try:
            from api import links
            assert hasattr(links, 'router')
            assert hasattr(links, 'get_links') or 'get_links' in dir(links.router)
            print("✅ Links router imported correctly")
            tests_passed += 1
        except Exception as e:
            print(f"❌ Links router import failed: {e}")
            traceback.print_exc()
            tests_failed += 1
        
        # Test collections router
        try:
            from api import collections
            assert hasattr(collections, 'router')
            print("✅ Collections router imported correctly")
            tests_passed += 1
        except Exception as e:
            print(f"❌ Collections router import failed: {e}")
            traceback.print_exc()
            tests_failed += 1
        
        # Test categories router
        try:
            from api import categories
            assert hasattr(categories, 'router')
            print("✅ Categories router imported correctly")
            tests_passed += 1
        except Exception as e:
            print(f"❌ Categories router import failed: {e}")
            traceback.print_exc()
            tests_failed += 1
        
    except Exception as e:
        print(f"❌ API routes tests failed: {e}")
        traceback.print_exc()
        tests_failed += 1
    
    print(f"\n✅ API routes tests: {tests_passed} passed, {tests_failed} failed\n")
    return tests_failed == 0


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("SmarTrack Backend - Refactored Code Test Suite")
    print("=" * 60 + "\n")
    
    all_tests_passed = True
    
    # Run import tests
    if not test_imports():
        all_tests_passed = False
    
    # Run utility function tests
    if not test_utility_functions():
        all_tests_passed = False
    
    # Run error class tests
    if not test_error_classes():
        all_tests_passed = False
    
    # Run API routes tests
    if not test_api_routes_import():
        all_tests_passed = False
    
    # Final summary
    print("=" * 60)
    if all_tests_passed:
        print("✅ ALL TESTS PASSED - Refactored code is working correctly!")
    else:
        print("❌ SOME TESTS FAILED - Please review the errors above")
    print("=" * 60 + "\n")
    
    return 0 if all_tests_passed else 1


if __name__ == "__main__":
    sys.exit(main())

