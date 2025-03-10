1. To install nvm, node.js and npm follow this link to start:
https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
Complete steps 1-9.

2. Once you have completed these steps, in Powershell you then must put in this Set-ExecutionPolicy Unrestricted

3. Next install npm by inserting this code npm install -g npm@11.1.0 into powershell to install npm.

4. Then input npm init -y

5. Then we need to install express and ejs for the components of my web application to work. So to do this we will input these into powershell as well.
npm install express
npm install ejs
npm install express-ejs-layouts

6. Finally, we can run the web application by inputting node app.js and you can open your preffered browser and go to localhost:5000 to see the web application.
