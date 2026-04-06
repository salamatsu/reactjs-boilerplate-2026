
PERSIST local storage data structure:

entry: {
  id: 123, // generated unique id for the event 
  scans: [1:10,2:2,3:10,4:10,5:10], // [ interactionId:points ]
  eventTag: mias, // will get from the api , this will load once
  goal: 100 // will get from the api , this will load once
}

GET events with list of interactions with points
- save to local
events: {
  ...eventDetails,
  eventTag: mias,
  goal: 100,
  interactions: [
    {
      id: 1,
      points: 10,
      name: "interaction 1"
    }
  ]
}

if no event and interactions fetched from api, show error modal it means no available event for now, please check back later or show empty state with the same message

Official link:
https://app.worldbexevents.com

features: 
can only access in mobile devices and tablet
1. show goal
2. show scans
3. save link to clipboard
4. must open in browser when clicked
5. “Scan to Win”
  -handle this link https://app.worldbexevents.com/mias?i=1&p10    
  - params /eventTag
  - query params : i= interaction id, p = points
  - if the eventTag is not found in local storage, show an error modal saying "This QR code is not valid for this event"
  - if the eventTag is found, update the scans array with the new points for the interaction id, and show a success modal with the points earned
  - if the eventTag is found but the interaction id is not in the scans array, add it to the scans array with the points, and show a success modal with the points earned
  - if the eventTag is found but the interaction id is in the scans array, show an error modal saying "You have already scanned this interaction"
  - if the total points in the scans array exceeds the goal, show a congratulatory modal saying "Congratulations! You have reached your goal!"
  - generate a qrcode when reached the goal; value will be an incripted localStorage data(id, scans, eventTag) with a secret key, and the QR code will be used to redeem the prize at the event
  - after handling the link, update the local storage with the new scans array
  - the modals should be comprehensive and user-friendly, with clear messages and a consistent design
6. a button to scan the QR code using the device camera, and handle the scanned link as described in point 5
7. show Digital Map of the event location // can be an image or a pdf
8. show event details (name, date, location, description) // manually designed for the event, no need to fetch from api
9. show a list of interactions with their points and whether they have been scanned or not
10. generate a shareable link for the event that can be shared with others, which will open the app and show the event details and allow them to scan interactions as well
11. Social Media Integration
12. Showcase other upcoming and ongoing events of Worldbex Services International Inc. with an option to register or learn more about them. 
  - https://register.worldbexevents.com/ // is the official website for event registration ( not in scope for this app, but can be linked to from the app)
  - the app can show a list of upcoming and ongoing events with a link to the registration page

roullete cms
https://app.worldbexevents.com/roulleteprizes // this is for the admin to manage the prizes for the roullete, not in scope for the app, but can be linked to from the app
1. a page to show the list of prizes that can be won from the roullete, with their details
2. a form to add a new prize to the roullete, with fields for the prize name, description, and image(optional)
3. a form to edit an existing prize in the roullete, with fields for the prize name, description, image(optional)
4. a button to delete a prize from the roullete
5. https://app.worldbexevents.com/roulleteprizespool
  - this is a secret route to set the item pool
  - the item can be set pool 1 or 0
  - when there is a pool = 1, this is only the prizes can be shuffled to win but still the roullete will show all the items to become not suspicious  


redeem prize
https://app.worldbexevents.com/redeem // pure online redeem, no local storage involved, just show the prize details and a button to redeem, which will call the api to redeem the prize and show a success modal with the prize details
1. landing page with the list of prizes that can be redeemed from scanning interactions

process:
  1. fetch the events and interactions from the api
    - if no event,interactions and prizes fetched from api, show error modal it means no available event for now, please check back later or show empty state with the same message
  2. scan the QR code of the visitor using the input field with qr code scanner device or the device camera
  3. the QR code will contain a link with the eventTag and interaction id and points
  4. validate the QR code by checking if the eventTag exists in local storage
    4.1. decrypt the data in the QR code using the secret key, and check if the eventTag matches
    4.2. if the eventTag does not exist, show an error modal saying "This QR code is not valid for this event"
  5. must take a survey after validating the qrcode
    5.1. the survey will be a simple form with a few questions about the event and the interactions
  6. a roullete will be shown after submitting the survey, with a chance to win a prize
    6.1. the roullete will have a list of prizes that can be won, with different probabilities
    6.2. the user can spin the roullete once per event, and the prize will be determined by the roullete
    6.3. if the user wins a prize, show a success modal with the prize details and a button to redeem, which will call the api to redeem the prize and show a success modal with the prize details


apis needed: 
// since this is not yet available, create a mock request
visitor web
 - events and interactions with points

redeem portal
 - events , interactions with points, list of prizes, survey questions
- save survey and claim prize

roullete and interactions cms
  - CRUD prizes including isPool
  - CRUD interacrtions
    - can generate qrcode
    - value format: https://app.worldbexevents.com/{{eventTag}}?i={{interactionId}}&p={{points}}