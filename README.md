# Appointment Scheduler
![Image](https://cosmicjs.com/uploads/b5467280-9745-11e7-9fec-572a0ce3e796-app-scheduler.png)
### [View Demo](https://cosmicjs.com/apps/appointment-scheduler/demo)

This Appointment Scheduler lets users select a day and a time slot between 1AM and 8PM eastern to meet with us. It integrates with AWS SQS to put a CBHOLD status in vicidialer with the time, and it updates the hubspot record associated with it with a TASK. It updates the Hubspot custom properties for vici. 

to tie the phone number together with the vici dial user it must look up the lead by phone number in the postgresql database table nextsales_leads
So if the user changes their phone number a manual fix will have to be made. 

if the schedule appointment fails a message with the SQS message posts to slack in the room #servermessages
