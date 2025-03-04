const express = require('express');
const expressLayouts = require('express-ejs-layouts')

const app = express();
const port = 5000

app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/images', express.static(__dirname + 'public/img'))

app.use(expressLayouts)
app.set('view engine', 'ejs')


app.get('/', (req, res) => {
    res.render('hello');
  });
 
 app.get('/top', (req,res) => {
    res.render('top.ejs');
 });

 app.listen(port, () => console.info(`App listening on port ${port}`));