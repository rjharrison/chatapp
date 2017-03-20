# Proof of concept / coding challenge for Affinitas.

```
git clone https://github.com/rjharrison/chatapp.git .
npm install
npm test
node index.js
```

Browse to http://your-ip:3000/ and off you go! 

# Implementation notes

The task email suggested that I complete this in whichever language I was most comfortable in, and hinted towards that being PHP. That would particularly make sense given that the role I've applied for is PHP-orientated, however for this particular task PHP would be a poor choice. I decided that if I were hiring someone I'd rather they knew how to pick the right tool for the right job, even though that means you don't get to see me writing PHP code. **With that in mind, this is a NodeJS implementation**. I had intending to write a PHP "admin interface" and pull data from the Node server via a little REST API, but time was short and I got a bit carried away with the UI :).

I hadn't intended to spend much time on the UI, but the more I coded the more I wanted a decent proof-of-concept. I picked Backbone as a lightweight framework mostly because I was refactoring HTML/JS that I'd already written inline and I didn't want the overhead of frontend build tools. 

The backend is http://socket.io and there is no persistance layer or storing of messages. This was my first time playing with this library and it was a fun experience - very satisfying to see a real-time chat application come alive before me. 

