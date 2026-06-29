# User Manual - Kingsleys Management Dashboard

## 1. How User Can Access
- **Registration**: Users can sign up via the signup page (`/signup`). A valid email, username, and password are required.
- **Activation**: Upon registration, an account starts in a **pending** state. An automated email is sent to the Admin, who must approve and activate the account.
- **Login**: Once activated, users can access the dashboard by navigating to the login page (`/`) and entering their credentials. A secure token maintains your active session.

## 2. How User uses the site (Normal User)
- **Dashboard View**: Upon login, normal users (Staff or Store Managers) are presented with their personalized Dashboard.
- **Modules Access**: The dashboard displays available modules (like Online Ordering, Invoicing, etc.). Normal users will only see modules assigned explicitly to them as active; the rest will show a "Locked" padlock icon.
- **Interaction**: Clicking an unlocked module card either opens a preview popup or opens the tool in a new browser tab.
- **Profile**: Users can navigate to "My Profile" in the sidebar to update their personal information or change their password.

## 3. How the Admin Works / Usage
Admins have full privileges to manage the entire application. The **Admin Panel** provides several features:
- **Manage Users**: Admins can view all users, filter by active/pending/roles, and perform actions like Edit, Deactivate, or Delete.
- **Activate Accounts**: Admins review pending signups and approve them, instantly triggering an activation email to the user.
- **Assign Roles**: Admins can change a user's role (Admin, Operation Manager, Store Manager, or Staff).
- **Assign Modules**: Admins explicitly toggle which modules a Store Manager or Staff member can access.
- **Impersonation (Switch User)**: Admins can seamlessly switch into another user's account to see the dashboard from their perspective, which helps in debugging module access issues.

## 4. How to use application
- **Navigation**: Use the left-hand sidebar to navigate between the main Dashboard, the Admin Panel (if authorized), and your Profile.
- **Search & Filters**: On the Dashboard, use the search bar to find a specific module by name, or use the "Active" and "Locked" filters to narrow down the view.
- **Logout**: To safely end the session, click the "Sign out" button located at the bottom of the sidebar.

## 5. Testing Credentials
To test the live web application at [https://dashboard.projectkingsleys.com/](https://dashboard.projectkingsleys.com/), use the following accounts:

- **Admin**
  - Email: `kokabnaveed2002@gmail.com`
  - Password: `37p^&sipQBovpn`

- **Operation Manager**
  - Email: `kokabnaveed9702@gmail.com`
  - Password: `zaNz@oDkK5*2So`

- **Store Manager**
  - Email: `kokab.naveed.ts@gmail.com`
  - Password: `Wa7uRwZ7ojH4KE`

- **Staff**
  - Email: `kokab.naveed@techscapesolution.com`
  - Password: `dPwFwq3eoEXMa7`
