# Atlas Library System

A blockchain based hassle-free library rental system built around the concept of ERC20 tokens powered by EthVigil API.

[Checkout the Live Demo](https://atlas-library-system.herokuapp.com/)

### The Blockchain Dev

There is the primary smart contract to which the web app makes write calls using the EthVigil API, to transfer tokens and temporarily hold them before being redirected to the authors.&nbsp; <br>
The BookAccess smart contract provides the rental status of the books by calculating and storing the rental expiry time.&nbsp; <br>
Through the admin portal, the tokens stored in the primary contract is redirected to the author's account.<br>
Additionally, all the ebook PDFs are stored on Sia's Skynet Portal which is decentralized CDN and file sharing platform.

### The Web App

The Web App is simple and user friendly. The login system is built using the auth0-passport strategy which allows user directly to login with their Google account and therefore, there is no hassle of having to remember another password.<br>
A deterministic ethereum address is generated using the user's email address and a salt, which abstracts away the hassle of having to create and manage an ethereum account.<br>
Users can easily purchase tokens (the production version will include a payment gateway for this purpose) and use these tokens to rent books.<br>
All the books are rendered as 'read only' using the PDF.js library and are temporarily cached onto the server and deleted when the user logs out. There are several measures to ensure only the user who has access to the book is able to view it and no one else.<br>
There is transaction log that is maintained along with the EtherScan link for users to view their ethereum transaction details.
