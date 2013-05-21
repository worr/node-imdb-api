# node-imdb-api

A non-scraping, functional node.js interface to imdb

# Use

Get an imdb object:

    var imdb = require('imdb-api');

Call get.

    var movie;
    imdb.getReq({ name: 'The Toxic Avenger' }, function(err, things) {
        movie = things;
    });

DATA

    console.log(movie);

    { imdbid: 'tt0090190',
      imdburl: 'http://www.imdb.com/title/tt0090190/',
      genres: 'Action,Comedy,Horror,Sci-Fi',
      languages: 'English',
      country: 'USA',
      votes: '11103',
      stv: 0,
      series: 0,
      rating: '6.0',
      runtime: '87min,Canada:78min,USA:82min(unratedversion:DirectorsCut),Argentina:87min(MardelPlataFilmFestival),USA:78min(R-ratedversion)',
      title: 'The Toxic Avenger',
      year: '1984',
      usascreens: 0,
      ukscreens: 0,
      episodes: null 
    }

Furthermore if you already know the id you can call getReq with different args:

    var movie;
    imdb.getReq({ id: '0090190' }, function(err, things) {
        movie = things;
    });

DATA

    console.log(movie);

    { imdbid: 'tt0090190',
      imdburl: 'http://www.imdb.com/title/tt0090190/',
      genres: 'Action,Comedy,Horror,Sci-Fi',
      languages: 'English',
      country: 'USA',
      votes: '11103',
      stv: 0,
      series: 0,
      rating: '6.0',
      runtime: '87min,Canada:78min,USA:82min(unratedversion:DirectorsCut),Argentina:87min(MardelPlataFilmFestival),USA:78min(R-ratedversion)',
      title: 'The Toxic Avenger',
      year: '1984',
      usascreens: 0,
      ukscreens: 0,
      episodes: null
    }

What is this episodes shit?

Well, it's a function! Give it a callback!

    imdb.get('How I Met Your Mother', function(err, things) {
        things.episodes(function(err, moreThings) {
            console.log(moreThings);
        });
    });

    null
    { imdbid: 'tt0460649',
      imdburl: 'http://www.imdb.com/title/tt0460649/',
      genres: 'Comedy,Romance',
      languages: 'English',
      country: 'USA',
      votes: '129900',
      stv: 1,
      series: 0,
      rating: '8.6',
      runtime: '25min(22episodes)',
      title: 'How I Met Your Mother',
      usascreens: 0,
      ukscreens: 0,
      episodes: [Function: episodes] }
    [ { season: 6, name: 'A Change of Heart', number: 18 },
      { season: 2, name: 'Aldrin Justice', number: 6 },
      { season: 6, name: 'Architect of Destruction', number: 5 },
      { season: 2, name: 'Arrivederci, Fiero', number: 17 },
      { season: 4, name: 'As Fast as She Can', number: 23 },
      { season: 2, name: 'Atlantic City', number: 8 },
      { season: 6, name: 'Baby Talk', number: 6 },
      { season: 2, name: 'Bachelor Party', number: 19 },
      { season: 6, name: 'Bad News', number: 13 },
      { season: 5, name: 'Bagpipes', number: 6 },
      { season: 1, name: 'Belly Full of Turkey', number: 9 },
      { season: 4, name: 'Benefits', number: 12 },
      { season: 1, name: 'Best Prom Ever', number: 20 },
      { season: 6, name: 'Big Days', number: 1 },
      { season: 6, name: 'Blitzgiving', number: 10 },
      { season: 2, name: 'Brunch', number: 3 },
      { season: 6, name: 'Canning Randy', number: 7 },
      { season: 6, name: 'Challenge Accepted', number: 24 },
      { season: 6, name: 'Cleaning House', number: 2 },
      { season: 2, name: 'Columns', number: 13 },
      { season: 1, name: 'Come On', number: 22 },
      { season: 1, name: 'Cupcake', number: 16 },
      { season: 5, name: 'Definitions', number: 1 },
      { season: 6, name: 'Desperation Day', number: 16 },
      { season: 7, name: 'Disaster Averted', number: 9 },
      { season: 4, name: 'Do I Know You?', number: 1 },
      { season: 5, name: 'Doppelgangers', number: 24 },
      { season: 5, name: 'Double Date', number: 2 },
      { season: 3, name: 'Dowisetrepla', number: 7 },
      { season: 1, name: 'Drumroll, Please', number: 13 },
      { season: 7, name: 'Ducky Tie', number: 3 },
      { season: 5, name: 'Duel Citizenship', number: 5 },
      { season: 3, name: 'Everything Must Go', number: 19 },
      { season: 6, name: 'False Positive', number: 12 },
      { season: 7, name: 'Field Trip', number: 5 },
      { season: 2, name: 'First Time in New York', number: 12 },
      { season: 1, name: 'Game Night', number: 15 },
      { season: 6, name: 'Garbage Island', number: 17 },
      { season: 5, name: 'Girls Vs. Suits', number: 12 },
      { season: 6, name: 'Glitter', number: 9 },
      { season: 4, name: 'Happily Ever After', number: 6 },
      { season: 5, name: 'Home Wreckers', number: 20 },
      { season: 5, name: 'Hooked', number: 16 },
      { season: 6, name: 'Hopeless', number: 21 },
      { season: 3, name: 'How I Met Everyone Else', number: 5 },
      { season: 2, name: 'How Lily Stole Christmas', number: 11 },
      { season: 4, name: 'I Heart NJ', number: 3 },
      { season: 3, name: 'I\'m Not That Guy', number: 6 },
      { season: 4, name: 'Intervention', number: 4 },
      { season: 5, name: 'Jenkins', number: 13 },
      { season: 6, name: 'Landmarks', number: 23 },
      { season: 5, name: 'Last Cigarette Ever', number: 11 },
      { season: 6, name: 'Last Words', number: 14 },
      { season: 6, name: 'Legendaddy', number: 19 },
      { season: 1, name: 'Life Among the Gorillas', number: 17 },
      { season: 3, name: 'Little Boys', number: 4 },
      { season: 4, name: 'Little Minnesota', number: 11 },
      { season: 2, name: 'Lucky Penny', number: 15 },
      { season: 1, name: 'Mary the Paralegal', number: 19 },
      { season: 1, name: 'Matchmaker', number: 7 },
      { season: 1, name: 'Milk', number: 21 },
      { season: 3, name: 'Miracles', number: 20 },
      { season: 2, name: 'Monday Night Football', number: 14 },
      { season: 4, name: 'Mosbius Designs', number: 20 },
      { season: 2, name: 'Moving Day', number: 18 },
      { season: 4, name: 'Murtaugh', number: 19 },
      { season: 7, name: 'Mystery vs. History', number: 6 },
      { season: 6, name: 'Natural History', number: 8 },
      { season: 3, name: 'No Tomorrow', number: 12 },
      { season: 7, name: 'Noretta', number: 7 },
      { season: 4, name: 'Not a Father\'s Day', number: 7 },
      { season: 1,
        name: 'Nothing Good Happens After 2 AM',
        number: 18 },
      { season: 5, name: 'Of Course', number: 17 },
      { season: 6, name: 'Oh Honey', number: 15 },
      { season: 1, name: 'Okay Awesome', number: 5 },
      { season: 4, name: 'Old King Clancy', number: 18 },
      { season: 5, name: 'Perfect Week', number: 14 },
      { season: 1, name: 'Pilot', number: 1 },
      { season: 1, name: 'Purple Giraffe', number: 2 },
      { season: 5, name: 'Rabbit or Duck', number: 15 },
      { season: 3, name: 'Rebound Bro', number: 18 },
      { season: 1, name: 'Return of the Shirt', number: 4 },
      { season: 4, name: 'Right Place Right Time', number: 22 },
      { season: 5, name: 'Robin 101', number: 3 },
      { season: 5, name: 'Robots Vs. Wrestlers', number: 22 },
      { season: 3, name: 'Sandcastles in the Sand', number: 16 },
      { season: 5, name: 'Say Cheese', number: 18 },
      { season: 4, name: 'Shelter Island', number: 5 },
      { season: 2, name: 'Showdown', number: 20 },
      { season: 2, name: 'Single Stamina', number: 10 },
      { season: 2, name: 'Slap Bet', number: 9 },
      { season: 3, name: 'Slapsgiving', number: 9 },
      { season: 5,
        name: 'Slapsgiving 2: Revenge of the Slap',
        number: 9 },
      { season: 2, name: 'Something Blue', number: 22 },
      { season: 2, name: 'Something Borrowed', number: 21 },
      { season: 4, name: 'Sorry, Bro', number: 16 },
      { season: 3, name: 'Spoiler Alert', number: 8 },
      { season: 2, name: 'Stuff', number: 16 },
      { season: 6, name: 'Subway Wars', number: 4 },
      { season: 2, name: 'Swarley', number: 7 },
      { season: 7, name: 'Symphony of Illumination', number: 12 },
      { season: 2, name: 'Ted Mosby, Architect', number: 4 },
      { season: 3, name: 'Ten Sessions', number: 13 },
      { season: 4, name: 'The Best Burger in New York', number: 2 },
      { season: 7, name: 'The Best Man', number: 1 },
      { season: 3, name: 'The Bracket', number: 14 },
      { season: 3, name: 'The Chain of Screaming', number: 15 },
      { season: 1, name: 'The Duel', number: 8 },
      { season: 6, name: 'The Exploding Meatball Sub', number: 20 },
      { season: 4, name: 'The Fight', number: 10 },
      { season: 4, name: 'The Front Porch', number: 17 },
      { season: 3, name: 'The Goat', number: 17 },
      { season: 4, name: 'The Leap', number: 24 },
      { season: 1, name: 'The Limo', number: 11 },
      { season: 6, name: 'The Mermaid Theory', number: 11 },
      { season: 4, name: 'The Naked Man', number: 9 },
      { season: 7, name: 'The Naked Truth', number: 2 },
      { season: 6, name: 'The Perfect Cocktail', number: 22 },
      { season: 1, name: 'The Pineapple Incident', number: 10 },
      { season: 3, name: 'The Platinum Rule', number: 11 },
      { season: 5, name: 'The Playbook', number: 8 },
      { season: 4, name: 'The Possimpible', number: 14 },
      { season: 7, name: 'The Rebound Girl', number: 11 },
      { season: 5, name: 'The Rough Patch', number: 7 },
      { season: 2, name: 'The Scorpion and the Toad', number: 2 },
      { season: 5, name: 'The Sexless Innkeeper', number: 4 },
      { season: 1, name: 'The Slutty Pumpkin', number: 6 },
      { season: 7, name: 'The Slutty Pumpkin Returns', number: 8 },
      { season: 7, name: 'The Stinson Missile Crisis', number: 4 },
      { season: 4, name: 'The Stinsons', number: 15 },
      { season: 1, name: 'The Sweet Taste of Liberty', number: 3 },
      { season: 4, name: 'The Three Days Rule', number: 21 },
      { season: 1, name: 'The Wedding', number: 12 },
      { season: 5, name: 'The Wedding Bride', number: 23 },
      { season: 5, name: 'The Window', number: 10 },
      { season: 3, name: 'The Yips', number: 10 },
      { season: 3, name: 'Third Wheel', number: 3 },
      { season: 4, name: 'Three Days of Snow', number: 13 },
      { season: 7, name: 'Tick Tick Tick', number: 10 },
      { season: 5, name: 'Twin Beds', number: 21 },
      { season: 6, name: 'Unfinished', number: 3 },
      { season: 3, name: 'Wait for It', number: 1 },
      { season: 3, name: 'We\'re Not from Here', number: 2 },
      { season: 2, name: 'Where Were We?', number: 1 },
      { season: 4, name: 'Woooo!', number: 8 },
      { season: 2, name: 'World\'s Greatest Couple', number: 5 },
      { season: 1, name: 'Zip, Zip, Zip', number: 14 },
      { season: 5, name: 'Zoo or False', number: 19 },
      { season: 7, name: 'Karma', number: 18 },
      { season: 7, name: 'No Pressure', number: 17 },
      { season: 8, name: 'Episode #8.1', number: 1 },
      { season: 7, name: '46 Minutes', number: 14 },
      { season: 7, name: 'Good Crazy', number: 22 },
      { season: 7, name: 'Now We\'re Even', number: 21 },
      { season: 7, name: 'Tailgate', number: 13 },
      { season: 7, name: 'The Broath', number: 19 },
      { season: 7, name: 'The Burning Beekeeper', number: 15 },
      { season: 7, name: 'The Drunk Train', number: 16 },
      { season: 7, name: 'The Magician\'s Code: Part 1', number: 23 },
      { season: 7, name: 'The Magician\'s Code: Part 2', number: 24 },
      { season: 7, name: 'Trilogy Time', number: 20 } ]
        

# FAQ

## Why? There are like 3 other interfaces to imdb in npm

They all suck.

Why? Most of them scrape imdb. imdb explicitly forbids scarping. Screen 
scraping is slow, because you need to download the entire website.

And what happens when the site layout changes? Well then your screen scraping
solution fails in interesting ways.

## WOAH I looked at your code and you're using unofficial APIs! WTF DUDE

There isn't an official API to imdb. As soon as one is released (and I
notice), I'll update the module.

imdb DOES release all of their data in text files nightly, so unofficial sites
have popped up providing RESTful APIs against that data.

I have to use a few, since none of them are complete.

## What if one of the unofficial APIs disappears?

File a bug. I'll get creative.
