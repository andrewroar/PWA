# Unit 18 PWA Homework: Online/Offline Budget Trackers

I was given a webpage to track budget and improve the tracker such that it will work offline or in condition where you have poor internet.

## User Story

AS AN avid traveller
I WANT to be able to track my withdrawals and deposits with or without a data/internet connection
SO THAT my account balance is accurate when I am traveling

## Business Context

Giving users a fast and easy way to track their money is important, but allowing them to access that information anytime is even more important. Having offline functionality is paramount to our applications success.

## Solution

To make sure that the app works offline, I added a service-Worker and Manifest.webmanifest to the public. Both files are essential for PWA and their template can be found pretty easily on the internet.. These files will help me cache and fetch the file when the internet is down. I also added the html routeto the routes folder as the original document only included the api.

The tricky part of the homework is to "cache" the fetch request (which you cannot do). The saveRecord function suppose to handle this, it was declared in index.js but not written, thus I need to write the function itself. I wrote saveRecord to save the post object to the indexeddb when offline. Once the user go back to online, window.addEventListener will post all the object in the indexedDB to mongoose.
