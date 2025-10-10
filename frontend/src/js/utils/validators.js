// ======================================================================
// Zarmind Frontend Validators (client-side)
// - Lightweight validation helpers with Persian messages
// - Schema-based validator + domain-specific forms (product, customer, sale, auth)
// - Uses utils/helpers and constants (IR specific formats supported)
// ======================================================================

import {
  CARAT_OPTIONS,
  PAYMENT_METHODS,
  SALE_STATUS,
  REGEX,
} from "./constants.js";

import {
  toEnglishDigits,
  parseNumber,
  parseDate,
  isEmail as isEmailFn,
  isMobileIR as isMobileFn,
  isNationalIdIR as isNationalIdFn,
  isPostalCodeIR as isPostalCodeFn,
} from "./helpers.js";

// ----------------------------------------------------------------------
// Core helpers
// ----------------------------------------------------------------------

const isNil = (v) => v === null || v === undefined;
const isEmpty = (v) =>
  isNil(v) ||
  (typeof v === "string" && v.trim().length === 0) ||
  (Array.isArray(v) && v.length === 0);

const asString = (v) => (isNil(v) ? "" : String(v));
const asNumber = (v) => parseNumber(v);

const addError = (errors, field, message) => {
  if (!errors[field]) errors[field] = message;
};

export const firstError = (errors = {}) => {
  const key = Object.keys(errors)[0];
  return key ? errors[key] : null;
};

export const hasErrors = (errors = {}) => Object.keys(errors).length > 0;

// ----------------------------------------------------------------------
// Primitive rule builders (return {ok:boolean, msg?:string})
// Each rule receives (value, data) and should return null (ok) or message string.
// ----------------------------------------------------------------------

export const rules = {
  required:
    (label = "این فیلد") =>
    (v) =>
      isEmpty(v) ? `${label} الزامی است` : null,

  string:
    (label = "این فیلد", { min, max } = {}) =>
    (v) => {
      if (isNil(v)) return null;
      const s = asString(v).trim();
      if (min && s.length < min)
        return `${label} باید حداقل ${min} کاراکتر باشد`;
      if (max && s.length > max)
        return `${label} نباید بیش از ${max} کاراکتر باشد`;
      return null;
    },

  number:
    (label = "عدد", { min, max, integer, positive } = {}) =>
    (v) => {
      if (isNil(v) || v === "") return null; // use required separately
      const n = asNumber(v);
      if (!isFinite(n)) return `${label} نامعتبر است`;
      if (integer && !Number.isInteger(n)) return `${label} باید عدد صحیح باشد`;
      if (positive && n <= 0) return `${label} باید بزرگ‌تر از صفر باشد`;
      if (!isNil(min) && n < min) return `${label} باید حداقل ${min} باشد`;
      if (!isNil(max) && n > max) return `${label} نباید بیش از ${max} باشد`;
      return null;
    },

  enumOf:
    (label = "این فیلد", options = []) =>
    (v) =>
      isNil(v) || options.includes(v) ? null : `${label} نامعتبر است`,

  email:
    (label = "ایمیل") =>
    (v) => {
      if (isEmpty(v)) return null;
      return isEmailFn(v) ? null : `${label} نامعتبر است`;
    },

  mobileIR:
    (label = "شماره موبایل") =>
    (v) => {
      if (isEmpty(v)) return null;
      return isMobileFn(v) ? null : `${label} نامعتبر است`;
    },

  nationalIdIR:
    (label = "کد ملی") =>
    (v) => {
      if (isEmpty(v)) return null;
      return isNationalIdFn(v) ? null : `${label} نامعتبر است`;
    },

  postalCodeIR:
    (label = "کد پستی") =>
    (v) => {
      if (isEmpty(v)) return null;
      return isPostalCodeFn(v) ? null : `${label} نامعتبر است`;
    },

  regex:
    (label = "این فیلد", pattern, message = "نامعتبر است") =>
    (v) => {
      if (isEmpty(v)) return null;
      return pattern.test(asString(v)) ? null : `${label} ${message}`;
    },

  date:
    (label = "تاریخ") =>
    (v) => {
      if (isEmpty(v)) return null;
      const d = parseDate(v);
      return d ? null : `${label} نامعتبر است`;
    },

  // Domain short-hands
  carat:
    (label = "عیار") =>
    (v) =>
      CARAT_OPTIONS.includes(Number(v))
        ? null
        : `${label} باید یکی از ${CARAT_OPTIONS.join("، ")} باشد`,

  weight:
    (label = "وزن") =>
    (v) => {
      if (isEmpty(v) && v !== 0) return null;
      const n = asNumber(v);
      if (!isFinite(n)) return `${label} نامعتبر است`;
      if (n <= 0) return `${label} باید بزرگ‌تر از صفر باشد`;
      return null;
    },

  price:
    (label = "قیمت") =>
    (v) => {
      if (isEmpty(v) && v !== 0) return null;
      const n = asNumber(v);
      if (!isFinite(n)) return `${label} نامعتبر است`;
      if (n <= 0) return `${label} باید بزرگ‌تر از صفر باشد`;
      return null;
    },
};

// ----------------------------------------------------------------------
// Schema validator
// schema: { fieldName: [ruleFn(label,opts), ...], ... }
// returns { valid:boolean, errors:Object<string,string> }
// ----------------------------------------------------------------------

export const validateWithSchema = (schema = {}, data = {}) => {
  const errors = {};
  for (const field of Object.keys(schema)) {
    const value = data[field];
    const fieldRules = schema[field] || [];
    for (const rule of fieldRules) {
      const msg = rule(value, data);
      if (typeof msg === "string" && msg) {
        addError(errors, field, msg);
        break;
      }
    }
  }
  return { valid: !hasErrors(errors), errors };
};

// ----------------------------------------------------------------------
// Domain validators (form-level)
// ----------------------------------------------------------------------

// Product form
export const validateProductForm = (data = {}) => {
  const schema = {
    name: [
      rules.required("نام محصول"),
      rules.string("نام محصول", { min: 2, max: 255 }),
    ],
    category: [rules.required("دسته‌بندی")],
    type: [rules.required("نوع محصول")],
    carat: [rules.required("عیار"), rules.carat("عیار")],
    weight: [rules.required("وزن"), rules.weight("وزن")],
    wage: [rules.number("اجرت", { min: 0 })],
    stone_price: [rules.number("قیمت نگین", { min: 0 })],
    selling_price: [rules.required("قیمت فروش"), rules.price("قیمت فروش")],
    stock_quantity: [rules.number("موجودی", { min: 0, integer: true })],
    min_stock_level: [rules.number("حداقل موجودی", { min: 0, integer: true })],
    supplier: [rules.string("تامین‌کننده", { max: 255 })],
    location: [rules.string("محل نگهداری", { max: 100 })],
    description: [rules.string("توضیحات", { max: 2000 })],
  };
  return validateWithSchema(schema, data);
};

// Customer form
export const validateCustomerForm = (data = {}) => {
  const schema = {
    full_name: [
      rules.required("نام و نام خانوادگی"),
      rules.string("نام و نام خانوادگی", { min: 2, max: 255 }),
    ],
    phone: [rules.required("شماره موبایل"), rules.mobileIR("شماره موبایل")],
    email: [rules.email("ایمیل")],
    national_id: [rules.nationalIdIR("کد ملی")],
    city: [rules.string("شهر", { max: 100 })],
    address: [rules.string("آدرس", { max: 1000 })],
    postal_code: [rules.postalCodeIR("کد پستی")],
    credit_limit: [rules.number("سقف اعتبار", { min: 0 })],
    notes: [rules.string("یادداشت", { max: 2000 })],
  };
  return validateWithSchema(schema, data);
};

// Sale form
export const validateSaleForm = (data = {}) => {
  const errors = {};
  // items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    addError(errors, "items", "حداقل یک آیتم فروش باید انتخاب شود");
  } else {
    data.items.forEach((it, idx) => {
      const q = asNumber(it?.quantity);
      if (!it?.product_id)
        addError(errors, `items.${idx}.product_id`, "شناسه محصول الزامی است");
      if (!Number.isInteger(q) || q <= 0)
        addError(
          errors,
          `items.${idx}.quantity`,
          "تعداد باید عدد صحیح بزرگ‌تر از صفر باشد"
        );
    });
  }

  // amounts
  const amountRules = {
    discount: [rules.number("تخفیف", { min: 0 })],
    tax: [rules.number("مالیات", { min: 0 })],
    paid_amount: [rules.number("مبلغ پرداختی", { min: 0 })],
  };
  const { errors: amountErrors } = validateWithSchema(amountRules, data);
  Object.assign(errors, amountErrors);

  // payment method (optional but if present must be valid)
  if (!isNil(data.payment_method)) {
    const ok = Object.values(PAYMENT_METHODS).includes(
      String(data.payment_method)
    );
    if (!ok) addError(errors, "payment_method", "روش پرداخت نامعتبر است");
  }

  // status (optional)
  if (!isNil(data.status)) {
    const ok = Object.values(SALE_STATUS).includes(String(data.status));
    if (!ok) addError(errors, "status", "وضعیت فروش نامعتبر است");
  }

  return { valid: !hasErrors(errors), errors };
};

// Auth: login (username + password OR email + password on other form)
export const validateLoginForm = (data = {}) => {
  const schema = {
    username: [rules.required("نام کاربری")],
    password: [rules.required("رمز عبور")],
  };
  return validateWithSchema(schema, data);
};

export const validateLoginEmailForm = (data = {}) => {
  const schema = {
    email: [rules.required("ایمیل"), rules.email("ایمیل")],
    password: [rules.required("رمز عبور")],
  };
  return validateWithSchema(schema, data);
};

export const validateRegisterForm = (data = {}) => {
  const schema = {
    username: [
      rules.required("نام کاربری"),
      rules.string("نام کاربری", { min: 3, max: 50 }),
      rules.regex(
        "نام کاربری",
        /^[a-zA-Z0-9_-]+$/,
        "فقط می‌تواند شامل حروف انگلیسی، اعداد، - و _ باشد"
      ),
    ],
    email: [rules.required("ایمیل"), rules.email("ایمیل")],
    password: [
      rules.required("رمز عبور"),
      rules.string("رمز عبور", { min: 6, max: 128 }),
    ],
    full_name: [
      rules.required("نام کامل"),
      rules.string("نام کامل", { min: 2, max: 255 }),
    ],
    phone: [rules.mobileIR("شماره موبایل")],
  };
  const res = validateWithSchema(schema, data);
  if (!res.errors.password && data.password !== data.confirmPassword) {
    res.errors.confirmPassword = "تکرار رمز عبور مطابقت ندارد";
  }
  return { valid: !hasErrors(res.errors), errors: res.errors };
};

// Gold price
export const validateGoldPriceForm = (data = {}) => {
  const schema = {
    carat: [rules.required("عیار"), rules.carat("عیار")],
    price_per_gram: [rules.required("قیمت هر گرم"), rules.price("قیمت هر گرم")],
    date: [rules.date("تاریخ")],
  };
  return validateWithSchema(schema, data);
};

// Search/filter helpers
export const validatePaginationQuery = (query = {}) => {
  const errors = {};
  const page = asNumber(query.page);
  const limit = asNumber(query.limit);
  if (!isNil(query.page) && (!Number.isInteger(page) || page < 1))
    addError(errors, "page", "شماره صفحه نامعتبر است");
  if (
    !isNil(query.limit) &&
    (!Number.isInteger(limit) || limit < 1 || limit > 100)
  )
    addError(errors, "limit", "تعداد آیتم‌ها باید بین 1 تا 100 باشد");
  return { valid: !hasErrors(errors), errors };
};

// ----------------------------------------------------------------------
// Exports (default aggregate)
// ----------------------------------------------------------------------

const Validators = {
  // core
  rules,
  validateWithSchema,
  firstError,
  hasErrors,

  // domain
  validateProductForm,
  validateCustomerForm,
  validateSaleForm,
  validateLoginForm,
  validateLoginEmailForm,
  validateRegisterForm,
  validateGoldPriceForm,
  validatePaginationQuery,
};

export default Validators;
