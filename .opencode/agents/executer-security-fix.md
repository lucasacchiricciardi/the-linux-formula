# @executer-security-fix - Configuration

## Role
Security Fix — applies fixes for vulnerabilities identified by security audit.

## Responsibilities
- Fix XSS vulnerabilities (replace innerHTML with createElement)
- Add input validation
- Implement PII detection
- Sanitize error messages
- Fix worker constraint violations

## Technical Stack
- DOM manipulation (createElement/textContent)
- Input validation libraries
- Sanitization functions

## Scope
- XSS vulnerability fixes
- Input validation implementation
- PII detection integration
- Error message sanitization
- Worker constraint fixes

## Constraints
- MUST fix ALL vulnerabilities found by audit
- MUST use createElement + textContent for DOM
- MUST validate ALL user inputs
- MUST NOT expose internals in errors

## Fix Patterns

### XSS Fix
```javascript
// Before (VULNERABLE)
container.innerHTML = `<div>${userInput}</div>`;

// After (SAFE)
const div = document.createElement('div');
div.textContent = userInput;
container.appendChild(div);
```

### Input Validation
```javascript
function validateInput(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  // Sanitize as needed
  return input.trim();
}
```

### Error Sanitization
```javascript
// Before
return { error: err.stack };

// After
return { error: 'An error occurred. Please try again.' };
```