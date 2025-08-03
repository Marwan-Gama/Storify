// Validation helper functions and messages

export const VALIDATION_MESSAGES = {
  name: {
    required: "Name is required",
    minLength: "Name must be at least 2 characters",
    maxLength: "Name must be less than 100 characters",
    format: "Name can only contain letters and spaces",
  },
  email: {
    required: "Email is required",
    format: "Please enter a valid email",
    maxLength: "Email is too long",
  },
  password: {
    required: "Password is required",
    minLength: "Password must be at least 8 characters",
    maxLength: "Password is too long",
    complexity:
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    characters: "Password contains invalid characters",
  },
  confirmPassword: {
    required: "Please confirm your password",
    mismatch: "Passwords do not match",
  },
};

export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s]+$/,
  },
  email: {
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    complexityPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    characterPattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
  },
};

// Validation functions
export const validateName = (name) => {
  if (!name.trim()) return VALIDATION_MESSAGES.name.required;
  if (name.length < VALIDATION_RULES.name.minLength)
    return VALIDATION_MESSAGES.name.minLength;
  if (name.length > VALIDATION_RULES.name.maxLength)
    return VALIDATION_MESSAGES.name.maxLength;
  if (!VALIDATION_RULES.name.pattern.test(name))
    return VALIDATION_MESSAGES.name.format;
  return "";
};

export const validateEmail = (email) => {
  if (!email) return VALIDATION_MESSAGES.email.required;
  if (!VALIDATION_RULES.email.pattern.test(email))
    return VALIDATION_MESSAGES.email.format;
  if (email.length > VALIDATION_RULES.email.maxLength)
    return VALIDATION_MESSAGES.email.maxLength;
  return "";
};

export const validatePassword = (password) => {
  if (!password) return VALIDATION_MESSAGES.password.required;
  if (password.length < VALIDATION_RULES.password.minLength)
    return VALIDATION_MESSAGES.password.minLength;
  if (password.length > VALIDATION_RULES.password.maxLength)
    return VALIDATION_MESSAGES.password.maxLength;
  if (!VALIDATION_RULES.password.complexityPattern.test(password)) {
    return VALIDATION_MESSAGES.password.complexity;
  }
  if (!VALIDATION_RULES.password.characterPattern.test(password)) {
    return VALIDATION_MESSAGES.password.characters;
  }
  return "";
};

export const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) return VALIDATION_MESSAGES.confirmPassword.required;
  if (confirmPassword !== password)
    return VALIDATION_MESSAGES.confirmPassword.mismatch;
  return "";
};

// Password strength indicator
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: "Very Weak", color: "#ff4444" };

  let score = 0;

  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Complexity
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;

  if (score <= 2)
    return { strength: score, label: "Very Weak", color: "#ff4444" };
  if (score <= 3) return { strength: score, label: "Weak", color: "#ff8800" };
  if (score <= 4) return { strength: score, label: "Fair", color: "#ffaa00" };
  if (score <= 5) return { strength: score, label: "Good", color: "#00aa00" };
  return { strength: score, label: "Strong", color: "#008800" };
};

// Form validation
export const validateForm = (formData, fields) => {
  const errors = {};

  fields.forEach((field) => {
    switch (field) {
      case "name":
        errors.name = validateName(formData.name);
        break;
      case "email":
        errors.email = validateEmail(formData.email);
        break;
      case "password":
        errors.password = validatePassword(formData.password);
        break;
      case "confirmPassword":
        errors.confirmPassword = validateConfirmPassword(
          formData.confirmPassword,
          formData.password
        );
        break;
    }
  });

  return {
    errors,
    isValid: !Object.values(errors).some((error) => error),
  };
};
