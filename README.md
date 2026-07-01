1. Database

Install Postgres if not already there
Run createdb realestate_db

2. Backend setup

cd backend
npm install
npm run db:generate (generates Prisma client)
npm run db:migrate (creates tables)
npm run dev (starts server)
Check Swagger docs load at http://localhost:5000/api-docs

3. Frontend setup

cd frontend
npm install
cp .env.local.example .env.local (edit values if needed)
npm run dev
Open http://localhost:3000

4. Build/verify Auth module

Register a user
Login, confirm you get access token + refresh cookie
Test /api/auth/me with token
Test refresh flow
Test forgot-password / reset-password flow

5. Build/verify Property module

Create a listing (owner only)
List/search/filter/sort/paginate properties
Open single property detail (check view count increments)
Check similar properties endpoint
Try editing/deleting someone else's listing — should fail (ownership check)

6. Build/verify Inquiry module

Send inquiry to a property owner
Try sending duplicate inquiry — should get 409
Try inquiring on your own listing — should be blocked
Check rate limit (6th inquiry in 10 min should fail)
Check received/sent inquiry lists
Update inquiry status as owner

7. Security checks

Confirm rate limiting works on auth routes too
Confirm CORS blocks other origins
Confirm protected frontend routes redirect if not logged in
