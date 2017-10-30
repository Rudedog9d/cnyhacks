# cnyhacks
CNY Hackathon Web CTF

# Testing 0.0.1

0.0.1 is in prep for CNY Hackathon Fall 2017. It is NOT complete, but has a couple components ready for testing.
Details on the Fall 2017 project can be found [here](https://github.com/Rudedog9d/cnyhacks/projects/1?fullscreen=true)

### Background

#### Golden Store
The Golden Store is where we sell Flag Hints and a flag. It is the source of the Client Side Manipulation Flag.
Users only need enough Golden Credits to view the items, credits are not consumed - think of it as a status.   

### Things that _should_ work
- Registering as a new user
- Authentication - logging in, out, and sessions via a session cookie
- Purchasing a Meme
- Viewing a meme in the modal
- Viewing Golden Store
- Viewing Golden Item Details

### Things we know aren't finihsed
- An ability to legitimately earn credits
  - We intend to mitigate this with a button you click to earn a single credit
  - You can use a tool like [SQLite Browser](http://sqlitebrowser.org/) to edit the DB and give yourself credits
- User Creds - passwords are stored clear-text. 
  - Going to use [bcrypt](https://www.npmjs.com/package/bcrypt) to solve this
- Viewing Meme's kinda blows.
  - Will create a new Product Detail page if time allows
- Golden Credits are static (not earned or lost)
- Viewing account details
  - Current Credits and Golden Credits **can** be viewed
  - Bio **cannot** be viewed
  - Avatar **cannot** be viewed
- Can't Edit User profile
  - Need avatar selection to point people towards #7
  - Need BIO modifying for #29
  
## Set Up

Running cnyhacks is just like running any other NPM app, but here's the copy-paste verison:
```bash
# Clone Repo
git clone git@github.com:Rudedog9d/cnyhacks.git
cd cnyhacks

# Checkout current release
git checkout 0.0.1 

# Install NPM Dependicies
npm install

# Run it!
npm start
```

## Development

To begin developing, first follow all the steps defined in Set Up. Some things to note for development:
- Recommended IDE is [WebStorm](https://www.jetbrains.com/webstorm/) - Free to students, 
    worth the price for professionals
- There are two databases:
    - `<config.ProjectName>.db` - Production DB, and is committed to the repo
    - `<config.ProjectName>_DEV.db` - Development DB, **NEVER** committed to the repo.
                                      You may copy the prod DB to have a place to start
