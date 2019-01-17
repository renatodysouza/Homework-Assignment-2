
# Homework-Assignment-2

## Objectives


1. Create a public github repo for this assignment. 

2. Create a new post in the Facebook Group  and note "Homework Assignment #2" at the top.

3. In that thread, discuss what you have built, and include the link to your Github repo. 

The Assignment (Scenario):

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager: 

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account



 ## API Reference

 ### Token authenticate

##### Create Token
Method: POST
Required data: phone and password

localhost:3000/tokens

##### Extends token valid for more 1 hour
Method: PUT
Require data [phone,token]

localhost:3000/tokens


##### Delete token
Method: DELETE
Require data: token

localhost:3000/tokens

## USER 

##### Create user
Method: POST
Required data: firstname, lastname,street address,  phone, email, password,  tosAgreement

localhost:3000/users


##### Update User
Method: PUT
Required data: phone

localhost:3000/users


##### Get user
Method: GET
Required data: phone

localhost:3000/users?phone=555555555555

##### Delete User
Method: DELETE
Required data: phone

localhost:3000/users?phone=555555555555


 ##  Menus 


##### Create Menu
Method: POST
Required data: phone

Require data: product, description, quantity, stock, price

localhost:3000/menus


##### Update Menu
Method: PUT
Required data: id
update fields: product, description, quantity, stock, price

localhost:3000/menus

##### Get all Menus
Method: GET
Required data: id

localhost:3000/menus


##### Get Menu
Method: GET
Required data: id

localhost:3000/menus?id=1

##### Delete Menu
Method: DELETE
Required data: id

localhost:3000/menus?id=1



## Carts 


##### Create Cart
Method: POST
Required data: menuId Array(string)

localhost:3000/cart


##### Get Cart
Method: GET
Required data: none

localhost:3000/cart

##### Delete All Cart
Method: DELETE
Required data: id

localhost:3000/cart?id=42342345345435435

##### Delete one or more product(s) in the Cart
Method: DELETE
Required data: id

localhost:3000/cart?id=0002_cart


##  Orders 


##### Create Order
Method: POST
Required data: none

localhost:3000/order

##### Get Order
Method: GET
Required data: phone

localhost:3000/menus?phone=4345435435

##### Delete Order
Method: DELETE
Required data: id

localhost:3000/menus?id=42342345345435435



##  Checkout 


##### Create Checkout
Method: POST
localhost:3000/checkout



## External Dependencies
Stripe
Mailgun
