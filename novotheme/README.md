```
  /$$$$$$                            /$$ /$$       /$$                 /$$                
 /$$__  $$                          | $$|__/      | $$                | $$                
| $$  \__/  /$$$$$$  /$$    /$$ /$$$$$$$ /$$      | $$        /$$$$$$ | $$$$$$$   /$$$$$$$
| $$ /$$$$ |____  $$|  $$  /$$//$$__  $$| $$      | $$       |____  $$| $$__  $$ /$$_____/
| $$|_  $$  /$$$$$$$ \  $$/$$/| $$  | $$| $$      | $$        /$$$$$$$| $$  \ $$|  $$$$$$ 
| $$  \ $$ /$$__  $$  \  $$$/ | $$  | $$| $$      | $$       /$$__  $$| $$  | $$ \____  $$
|  $$$$$$/|  $$$$$$$   \  $/  |  $$$$$$$| $$      | $$$$$$$$|  $$$$$$$| $$$$$$$/ /$$$$$$$/
 \______/  \_______/    \_/    \_______/|__/      |________/ \_______/|_______/ |_______/ 
                                                                                          
```
# App: NovoTheme
### Ricardo Quintas (RQU) | Oct/2018
This app was created to store everything Theme related for the Novo Cats project.

It's not 100% correct to call it an app, because we will only be storing here :

- Global CSS
- Logos and icons

What this means is that there's no UI5 related stuff like manifest.json, neon-app.json, etc...

Moreover, we are not using SAP Theme Designer, because that is a big mess.
It is much better (and clean) to use a properly structured global CSS file to work as a "theme".

Each single app can then implement their own specific CSS of course, but this app NovoTheme
sould set the global CSS stuff.

