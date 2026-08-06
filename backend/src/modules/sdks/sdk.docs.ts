/**
 * @openapi
 * components:
 *   schemas:
 *     Sdk:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         language:
 *           type: string
 *           enum: [typescript, python, java, go, ruby, php]
 *         framework:
 *           type: string
 *           nullable: true
 *         spec:
 *           type: object
 *           nullable: true
 *           description: OpenAPI/spec used to generate the SDK
 *         status:
 *           type: string
 *           enum: [draft, generating, ready, failed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SdkListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Sdk'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @openapi
 * /api/sdks:
 *   get:
 *     tags: [SDKs]
 *     summary: List SDK projects owned by the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, generating, ready, failed]
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [typescript, python, java, go, ruby, php]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of SDKs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SdkListResponse'
 *   post:
 *     tags: [SDKs]
 *     summary: Create an SDK project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [typescript, python, java, go, ruby, php]
 *                 default: typescript
 *               framework:
 *                 type: string
 *               spec:
 *                 type: object
 *                 description: OpenAPI/spec to generate the SDK from
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Sdk'
 */

/**
 * @openapi
 * /api/sdks/{id}:
 *   get:
 *     tags: [SDKs]
 *     summary: Get an SDK project by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: SDK details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Sdk'
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [SDKs]
 *     summary: Update an SDK project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [typescript, python, java, go, ruby, php]
 *               framework:
 *                 type: string
 *               spec:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [draft, generating, ready, failed]
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags: [SDKs]
 *     summary: Delete an SDK project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
