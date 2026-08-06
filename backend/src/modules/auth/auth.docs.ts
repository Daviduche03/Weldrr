/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         accountType:
 *           type: string
 *           enum: [developer, team]
 *         company:
 *           type: string
 *           nullable: true
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *         isEmailVerified:
 *           type: boolean
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *     LoginResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             tokens:
 *               $ref: '#/components/schemas/AuthTokens'
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, accountType]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *                 minLength: 2
 *               accountType:
 *                 type: string
 *                 enum: [developer, team]
 *               company:
 *                 type: string
 *                 description: Company name, optional
 *               avatarUrl:
 *                 type: string
 *                 format: url
 *                 description: Avatar image URL. Obtain via POST /api/uploads.
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       409:
 *         description: Email already registered
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @openapi
 * /api/auth/oauth:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in with Google or Apple
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider, token]
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, apple]
 *               token:
 *                 type: string
 *                 description: ID token from Google or Apple Sign-In
 *     responses:
 *       200:
 *         description: OAuth sign-in successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid token
 */

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 */

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset code
 *     description: Sends a 4-digit reset code to the email if an account exists. Always returns the same response to avoid leaking which emails are registered.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic success — a code is sent only if the account exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with the code sent to your email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
 *                 description: 4-digit reset code from forgot-password
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Invalid or expired code
 */

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with the OTP sent after password registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
 *                 description: 4-digit verification code
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired code
 *       404:
 *         description: No account found with that email
 */

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code sent
 *       400:
 *         description: Email already verified or OAuth account
 *       404:
 *         description: No account found with that email
 */

/**
 * @openapi
 * /api/auth/resend-reset-code:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the password reset code
 *     description: Always returns the same response to avoid leaking which emails are registered. Sends a new 4-digit code only if the account exists and has a password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic success
 */

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *   patch:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               accountType:
 *                 type: string
 *                 enum: [developer, team]
 *               company:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
