import { z } from "zod";

/**
 * Validates form values against a Zod schema
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {Object} values - The form values to validate
 * @returns {Object} - Object with success status and errors if any
 */
export const validateWithZod = (schema, values) => {
  try {
    schema.parse(values);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      return { success: false, errors: formattedErrors };
    }
    return { success: false, errors: { general: "Validation failed" } };
  }
};

/**
 * Creates an Ant Design form validator from a Zod schema
 * Usage: rules={[zodValidator(schema)]}
 */
export const zodValidator = (schema) => ({
  validator: async (_, value) => {
    try {
      schema.parse(value);
      return Promise.resolve();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Promise.reject(error.errors[0].message);
      }
      return Promise.reject("Validation failed");
    }
  },
});

/**
 * Creates Ant Design form rules from a Zod schema field
 * @param {z.ZodSchema} fieldSchema - The Zod schema for a specific field
 * @returns {Array} - Array of Ant Design form rules
 */
export const zodToAntdRules = (fieldSchema) => {
  return [
    {
      validator: async (_, value) => {
        try {
          fieldSchema.parse(value);
          return Promise.resolve();
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Promise.reject(error.errors[0].message);
          }
          return Promise.reject("Validation failed");
        }
      },
    },
  ];
};

/**
 * Validates entire form and returns formatted errors for Ant Design
 * @param {z.ZodSchema} schema - The Zod schema
 * @param {Object} values - Form values
 * @returns {Promise} - Promise that resolves with values or rejects with formatted errors
 */
export const validateFormWithZod = async (schema, values) => {
  try {
    const validatedData = schema.parse(values);
    return Promise.resolve(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        name: err.path,
        errors: [err.message],
      }));
      return Promise.reject({
        errorFields: fieldErrors,
        values,
      });
    }
    return Promise.reject(error);
  }
};

export default {
  validateWithZod,
  zodValidator,
  zodToAntdRules,
  validateFormWithZod,
};
