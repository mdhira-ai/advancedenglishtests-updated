export interface EmailTemplateProps {
  to: string;
  subject: string;
  userName?: string;
  verificationUrl?: string;
  resetUrl?: string;
}

export const getWelcomeEmailTemplate = (userName: string) => {
  return {
    subject: "Welcome to AdvancedEnglishTests - Your IELTS Journey Starts Here!",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AdvancedEnglishTests</title>
          <style>
              @media only screen and (max-width: 480px) {
                  .container {
                      width: 100% !important;
                      margin: 0 !important;
                  }
                  .header {
                      padding: 15px !important;
                  }
                  .header h1 {
                      font-size: 20px !important;
                  }
                  .header p {
                      font-size: 14px !important;
                  }
                  .body {
                      padding: 20px !important;
                  }
                  .body h2 {
                      font-size: 18px !important;
                  }
                  .body p {
                      font-size: 14px !important;
                  }
                  .body li {
                      font-size: 14px !important;
                  }
                  .button {
                      display: block !important;
                      width: 100% !important;
                      text-align: center !important;
                      box-sizing: border-box !important;
                  }
                  .footer {
                      padding: 15px !important;
                  }
                  .social-icons a {
                      margin: 0 4px !important;
                  }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                  <td class="header" style="padding: 20px; text-align: center; background-color: #1A3A6E;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">AdvancedEnglishTests</h1>
                      <p style="color: #ffffff; margin: 8px 0 0; font-size: 16px;">Conquer IELTS with Free Practice Tools, Live the Life You Dream</p>
                  </td>
              </tr>
              <!-- Body -->
              <tr>
                  <td class="body" style="padding: 30px;">
                      <h2 style="color: #1A3A6E; font-size: 20px; margin: 0 0 16px;">Welcome to AdvancedEnglishTests!</h2>
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
                          Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
                          Thank you for registering with AdvancedEnglishTests! We're excited to help you conquer your IELTS goals with our <strong>free computer-based platform</strong>. Get started with live speaking practice, connect with new friends, and access powerful tools to excel in both computer- and paper-based tests.
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
                          Here's how you can kickstart your IELTS preparation today:
                      </p>
                      <ul style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px; padding-left: 20px;">
                          <li><a href="https://www.advancedenglishtests.com/speaking" style="color: #4F5BD5; text-decoration: none;">Schedule Live Speaking Practice</a>: Connect with others to boost your fluency.</li>
                          <li><a href="https://www.advancedenglishtests.com/cambridge" style="color: #4F5BD5; text-decoration: none;">Cambridge Tests 8–17</a>: Practice official-style questions.</li>
                          <li><a href="https://www.advancedenglishtests.com/cambridge-test-plus" style="color: #4F5BD5; text-decoration: none;">Cambridge Test Plus 1–3</a>: Extra prep for all skills.</li>
                          <li><a href="https://www.advancedenglishtests.com/speaking-check" style="color: #4F5BD5; text-decoration: none;">Free Speaking Checker</a>: Get instant feedback on your fluency.</li>
                          <li><a href="https://www.advancedenglishtests.com/writing-check" style="color: #4F5BD5; text-decoration: none;">Free Writing Checker</a>: Improve essays with AI-powered insights.</li>
                      </ul>
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
                          Start your journey now and unlock the life you dream of with AdvancedEnglishTests!
                      </p>
                      <table role="presentation" style="margin: 20px auto;">
                          <tr>
                              <td style="text-align: center;">
                                  <a href="https://www.advancedenglishtests.com/speaking" class="button" style="display: inline-block; padding: 12px 24px; background-color: #FF8C42; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 4px;">Start Your Free Practice</a>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <!-- Footer -->
              <tr>
                  <td class="footer" style="padding: 20px; background-color: #f4f4f4; text-align: center;">
                      <div class="social-icons" style="margin-bottom: 12px;">
                          <a href="https://www.facebook.com/advancedenglishtests" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width: 32px; height: 32px; border-radius: 50%;" />
                          </a>
                          <a href="https://www.instagram.com/advancedenglishtests/" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 32px; height: 32px; border-radius: 50%;" />
                          </a>
                      </div>
                      <p style="color: #333333; font-size: 12px; margin: 0;">© 2025 AdvancedEnglishTests. All rights reserved.</p>
                      <p style="margin: 8px 0 0;">
                          <a href="https://www.advancedenglishtests.com/privacy" style="color: #4F5BD5; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                      </p>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `
  };
};

export const getEmailVerificationTemplate = (subject: string, verificationUrl: string) => {
  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - AdvancedEnglishTests</title>
          <style>
              @media only screen and (max-width: 480px) {
                  .container {
                      width: 100% !important;
                      margin: 0 !important;
                  }
                  .header {
                      padding: 15px !important;
                  }
                  .header h1 {
                      font-size: 24px !important;
                  }
                  .header p {
                      font-size: 16px !important;
                  }
                  .body {
                      padding: 20px !important;
                  }
                  .body h2 {
                      font-size: 20px !important;
                  }
                  .body p {
                      font-size: 14px !important;
                  }
                  .button {
                      display: block !important;
                      width: 100% !important;
                      text-align: center !important;
                      box-sizing: border-box !important;
                  }
                  .footer {
                      padding: 15px !important;
                  }
                  .social-icons a {
                      margin: 0 4px !important;
                  }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                  <td class="header" style="padding: 20px; text-align: center; background-color: #1A3A6E;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AdvancedEnglishTests</h1>
                      <p style="color: #ffffff; margin: 8px 0 0; font-size: 18px; font-weight: bold;">${subject}</p>
                  </td>
              </tr>
              <!-- Body -->
              <tr>
                  <td class="body" style="padding: 30px;">
                      <h2 style="color: #1A3A6E; font-size: 22px; margin: 0 0 16px; text-align: center;">Welcome! Please Verify Your Account</h2>
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px; text-align: center;">
                          To get started with AdvancedEnglishTests, click the button below to verify your email address. This helps us keep your account secure.
                      </p>
                      <table role="presentation" style="margin: 20px auto;">
                          <tr>
                              <td style="text-align: center;">
                                  <a href="${verificationUrl}" class="button" style="display: inline-block; padding: 12px 24px; background-color: #FF8C42; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 4px;">Verify Email</a>
                              </td>
                          </tr>
                      </table>
                      <p style="color: #333333; font-size: 14px; line-height: 1.5; margin: 20px 0 0; text-align: center; font-style: italic;">
                          If you didn't create an account, please ignore this email.
                      </p>
                  </td>
              </tr>
              <!-- Footer -->
              <tr>
                  <td class="footer" style="padding: 20px; background-color: #f4f4f4; text-align: center;">
                      <div class="social-icons" style="margin-bottom: 12px;">
                          <a href="https://www.facebook.com/advancedenglishtests" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width: 32px; height: 32px; border-radius: 50%;" />
                          </a>
                          <a href="https://www.instagram.com/advancedenglishtests/" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 32px; height: 32px; border-radius: 50%;" />
                          </a>
                      </div>
                      <p style="color: #333333; font-size: 12px; margin: 0;">© 2025 AdvancedEnglishTests. All rights reserved.</p>
                      <p style="margin: 8px 0 0;">
                          <a href="https://www.advancedenglishtests.com/privacy" style="color: #4F5BD5; text-decoration: none; font-size: 12px;">Privacy Policy</a> 
                      </p>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `
  };
};

export const getPasswordResetTemplate = (subject: string, resetUrl: string) => {
  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - AdvancedEnglishTests</title>
          <style>
              @media only screen and (max-width: 480px) {
                  .container {
                      width: 100% !important;
                      margin: 0 !important;
                  }
                  .header {
                      padding: 15px !important;
                  }
                  .header h1 {
                      font-size: 24px !important;
                  }
                  .header p {
                      font-size: 16px !important;
                  }
                  .body {
                      padding: 20px !important;
                  }
                  .body h2 {
                      font-size: 20px !important;
                  }
                  .body p {
                      font-size: 14px !important;
                  }
                  .button {
                      display: block !important;
                      width: 100% !important;
                      text-align: center !important;
                      box-sizing: border-box !important;
                  }
                  .footer {
                      padding: 15px !important;
                  }
                  .social-icons a {
                      margin: 0 4px !important;
                  }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                  <td class="header" style="padding: 20px; text-align: center; background-color: #1A3A6E;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AdvancedEnglishTests</h1>
                      <p style="color: #ffffff; margin: 8px 0 0; font-size: 18px; font-weight: bold;">${subject}</p>
                  </td>
              </tr>
              <!-- Body -->
              <tr>
                  <td class="body" style="padding: 30px;">
                      <h2 style="color: #1A3A6E; font-size: 22px; margin: 0 0 16px; text-align: center;">Reset Your Password</h2>
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px; text-align: center;">
                          We received a request to reset your password. Click the button below to create a new password.
                      </p>
                      <table role="presentation" style="margin: 20px auto;">
                          <tr>
                              <td style="text-align: center;">
                                  <a href="${resetUrl}" class="button" style="display: inline-block; padding: 12px 24px; background-color: #FF8C42; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 4px;">Reset Password</a>
                              </td>
                          </tr>
                      </table>
                      <p style="color: #333333; font-size: 14px; line-height: 1.5; margin: 20px 0 0; text-align: center; font-style: italic;">
                          If you didn't request a password reset, please ignore this email.
                      </p>
                  </td>
              </tr>
              <!-- Footer -->
              <tr>
                  <td class="footer" style="padding: 20px; background-color: #f4f4f4; text-align: center;">
                      <div class="social-icons" style="margin-bottom: 12px;">
                          <a href="https://www.facebook.com/advancedenglishtests" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width: 32px; height: 32px; border-radius: 50%;" />
                          </a>
                          <a href="https://www.instagram.com/advancedenglishtests/" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 32px; height: 32px; border-radius: 50%;" />
                          </a>
                      </div>
                      <p style="color: #333333; font-size: 12px; margin: 0;">© 2025 AdvancedEnglishTests. All rights reserved.</p>
                      <p style="margin: 8px 0 0;">
                          <a href="https://www.advancedenglishtests.com/privacy" style="color: #4F5BD5; text-decoration: none; font-size: 12px;">Privacy Policy</a> 
                      </p>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `
  };
};