# LeanK-client
Client application for LeanK, the app for Knowledge-linking for individuals and teams!

Requires that also the LeanK-server is running somewhere in the background (where the documents are stored). 
This client can then connect to one of the archives on the server, show its content and allow the user to edit documents.
A server is already running in Azure on: https://klinkserver.azurewebsites.net (default server if you just press ENTER when asked for server)

The idea behind this application is as follows:
- You can write documents about things (knowledge) that you want to remember and link all documents easily by using double square brackets.
- Try to log in to the archive test with password test
- Write a document about a person you need to remember, let's say 'Peter'
- In this document you can write 'Peter is the head of HR and works with [[Sally]] '
- When you save, the client understands there is an outgoing link to Sally.
- If you now click on Sally, her document is not on the server yet, so you are offered to start writing on it.
- Once you save the 'Sally-document' you can see in the client that Peter now is pointing to Sally. You are starting to build a graph of documents!
- The idea is that multiple persons can write these small document notes and link things together building a graph of documents about people, companies, systems, projects, teaams, problems, ideas, you-decide-what-next!

This first client is really bad but illustrates the concept.
Here is my wish-list:
- When you in the editor starts typing [[P then the system should suggest to autocomplete for 'Peter' and 'Paul' if they are in the graph already
- The links you create should be clickable in the document itself. I could not make this editor object work correctly with it... Can you?
- In the future, the server should have a login with a password before you can start creating archives.
- There should be an easy way of inviting others to help on your graph og documents.

Hope you like the idea and see the value of this tool. Would be cool to deliver such a tool that I have been looking for but not found at a reasonable price yet.

It would be great if someone wanted to make a mobile app too (or just a web-version that really works really well on mobile!)

Best regards,
Eirik Y. Øra, Oslo, Norway
eirik.ora@gmail.com