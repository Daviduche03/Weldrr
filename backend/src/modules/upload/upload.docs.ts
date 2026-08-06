/**
 * @openapi
 * /api/uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a file (image or PDF) to R2 storage
 *     description: Returns a public URL that can be passed to registration or other endpoints. Accepts image/jpeg, image/png, image/webp, image/gif, and application/pdf (max 5MB).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Public URL of the uploaded file
 *                     key:
 *                       type: string
 *                       description: Object key in R2
 *                     mimeType:
 *                       type: string
 *                     size:
 *                       type: integer
 *       400:
 *         description: Invalid file type or no file uploaded
 *       500:
 *         description: Upload failed
 */
