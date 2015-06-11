/**
 * Created by Roman on 26.02.2015.
 */
module.exports = {
    EMAIL_REGEXP: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    PHONE_NUMBER_REGEXP: /^\+[1-9]\d{6,14}$/,
    DEFAULT_TABLE: "members",
    PROJECT_NAME: 'WC2',
    TWILIO_CLIENT_NUMBER: '+14155992671',
    SIGN_UP_TEXT: 'Success sign up. Please verify your email and confirm it.',
    ON_UPLOAD_VIDEO: "Upload video success",
    LOG_IN: "Login successful",
    LOG_OUT: "Logout successful",

    //Errors text
    NOT_UNIQUE_EMAIL: "This email is already in use",
    VERIFY_EMAIL: "Please verify Your email!",
    CONFIRM_ERROR: "Invalid confirmToken",
    EMAIL_ERROR: "User was not found by email",
    PASS_ERROR: 'Password and Confirmation Password are not equal',
    KEY_ERROR: "Key already in use",
    INVALID_PHONE_NUMBER: "Invalid phone number",
    UNATHORIZED: 'UnAuthorized'
};