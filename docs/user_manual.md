# User Manual - Kingsleys Management Dashboard

## 1. How User Can Access

### Login Page
![Login Page Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Login+Page)
- **Login**: Once activated, users can access the dashboard by navigating to the login page (`/`) and entering their credentials. A secure token maintains your active session.

### Signup Page
![Signup Page Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Signup+Page)
- **Registration**: Users can sign up via the signup page (`/signup`). A valid email, username, and password are required.
- **Activation**: Upon registration, an account starts in a **pending** state. An automated email is sent to the Admin, who must approve and activate the account.

### Forgot Password
![Forgot Password Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Forgot+Password+Page)
- **Forgot Password**: If you forget your password, click "Forgot Password" on the login screen. You will receive an email with a secure link to reset it.

### Reset Password
![Reset Password Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Reset+Password+Page)
- **Reset Password**: Follow the email link to securely enter a new password.

---

## 2. How User uses the site (Normal User)

### Main Dashboard
![Dashboard Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Main+Dashboard)
- **Dashboard View**: Upon login, normal users (Staff or Store Managers) are presented with their personalized Dashboard.
- **Modules Access**: The dashboard displays available modules (like Online Ordering, Invoicing, etc.). Normal users will only see modules assigned explicitly to them as active; the rest will show a "Locked" padlock icon.
- **Interaction**: Clicking an unlocked module card either opens a preview popup or opens the tool in a new browser tab.

### User Profile
![User Profile Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+User+Profile+Page)
- **Profile**: Users can navigate to "My Profile" in the sidebar to update their personal information or change their password.

---

## 3. How the Admin Works / Usage

Admins have full privileges to manage the entire application. The **Admin Panel** provides several features:

### Manage Users
![Admin Manage Users Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Admin+-+Manage+Users)
- **Manage Users**: Admins can view all users, filter by active/pending/roles, and perform actions like Edit, Deactivate, or Delete.
- **Activate Accounts**: Admins review pending signups and approve them, instantly triggering an activation email to the user.

### Add New User
![Admin Add User Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Admin+-+Add+New+User)
- **Add User**: Manually create new accounts and explicitly assign their roles in one step.

### Role & Module Assignment
![Admin Role Assignment Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Admin+-+Role+Assignment)
- **Assign Roles**: Admins can change a user's role (Admin, Operation Manager, Store Manager, or Staff).
- **Assign Modules**: Admins explicitly toggle which modules a Store Manager or Staff member can access.

### Switch User (Impersonation)
![Admin Switch User Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Admin+-+Switch+User)
- **Impersonation (Switch User)**: Admins can seamlessly switch into another user's account to see the dashboard from their perspective, which helps in debugging module access issues.

---

## 4. Legal & Public Pages

### Terms of Use
![Terms of Use Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Terms+of+Use)
- View the terms of service that govern the application.

### Privacy Policy
![Privacy Policy Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Privacy+Policy)
- Details how user data is managed and secured.

### Coming Soon
![Coming Soon Screenshot](https://via.placeholder.com/800x400.png?text=Screenshot+of+Coming+Soon+Page)
- Displays for modules that are still under active development.

---

## 5. How to use application
- **Navigation**: Use the left-hand sidebar to navigate between the main Dashboard, the Admin Panel (if authorized), and your Profile.
- **Search & Filters**: On the Dashboard, use the search bar to find a specific module by name, or use the "Active" and "Locked" filters to narrow down the view.
- **Logout**: To safely end the session, click the "Sign out" button located at the bottom of the sidebar.

---

## 6. Testing Credentials
To test the live web application at [https://dashboard.projectkingsleys.com/](https://dashboard.projectkingsleys.com/), use the following accounts:

- **Admin**
  - Email: `kokabnaveed2002@gmail.com`
  - Password: `Admin1234`

- **Operation Manager**
  - Email: `kokabnaveed9702@gmail.com`
  - Password: `Admin1234`

- **Store Manager**
  - Email: `kokab.naveed.ts@gmail.com`
  - Password: `Admin1234`

- **Staff**
  - Email: `kokab.naveed@techscapesolution.com`
  - Password: `Admin1234`
