# Training Facility Backend Api



## API Endpoints

### Authentication
- POST api/auth/register
- POST api/auth/login
- POST api/auth/refresh
- POST api/auth/logout
- POST api/auth/logout-all   //logs out all sessions of a specific user

### Admin
- GET api/admin/users      //get all the users
- GET api/admin/users/:id      //get a specific users
- DELETE api/admin/users/:id      //get all the users

- PATCH /api/admin/:id/role  //changes the role of a user

- GET api/admin/plan/users   //get all users subscribed to a plan
- PATCH api/admin/plan/:id   //changes plan price
- DELETE api/admin/plan/:id   //deletes a plan

- DELETE api/admin/facilities/:id  //deletes a facility

- GET api/admin/role/users   //get all users based on a role

- GET api/admin/subscriptions  //get all the subscriptions
- GET api/admin/subscriptions/:id  //get a specific subscription
- GET api/admin/subscriptions/user  //get all the user with subscriptions along with the subscriptions
- PATCH api/admin/subscriptions/:id  //change a subscription information like status to expired
- DELETE api/admin/subscriptions/:id  //deletes a subscription

- GET api/admin/payments   //gets all payment information
- GET api/admin/payments/:id   //gets a specific payment information
- PATCH api/admin/payments/:id   //changes payment information
- DELETE api/admin/payments/:id   //deletes payment 

- GET api/admin/sessions   //gets all the activities
- GET api/admin/sessions/:id   //gets a specific activity
- PATCH api/admin/sessions/:id   //changes activity information
- DELETE api/admin/sessions/:id   //deletes an activity

- GET api/admin/analytics  //gets different information like summerizations
- POST api/admin/logout-all  //logs out all devices
### User

- GET api/users/me   //gets user information
- PATCH api/users/me   // alters a user's information
- DELETE api/users/me   //deletes a user

- GET api/users/subscriptions   //gets the services a user is subscribed to 
- POST api/users/subscriptions  //creates a subscription
- POST api/users/subscriptions/:id/cancel  //changes subscrioption status to cancell

- GET api/users/payments     //gets the payment information of a user
- POST api/users/payments   //creates a payment 
- PATCH api/users/payments/:id  //changes a user's payment information
- DELETE api/users/payments/:id  //deletes a user's payment

- GET api/users/sessions    //gets the user's activity log
- POST api/users/sessions  //creates a session
- PATCH api/users/sessions/:id/checkout  // changes a session's checkout
- DELETE api/users/sessions/:id  //deletes a session

### Plans
- GET api/plans   //gets available plans
- GET api/plans/facilities   //gets available facilities on a plan

### Facilities
- GET api/facilities  //gets the available facilities
