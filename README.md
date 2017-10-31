# cnyhacks
CNY Hackathon Web CTF

## Set Up

Running cnyhacks is just like running any other NPM app, but here's the copy-paste verison:
```bash
# Initialize Git LFS ( Requiured to pull binary files - get it from https://github.com/git-lfs/git-lfs/ )
git lfs install

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
