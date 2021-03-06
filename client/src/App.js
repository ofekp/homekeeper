import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'
import './App.css';
import {
  Route,
  NavLink,
  Router,
} from "react-router-dom";
import Home from "./Home";
import Devices from "./Devices";
import RiscoLogin from "./RiscoLogin";
import { getUserDetails, createUser, deleteUser, getCookie, revokeCookie, revokeAllCookies } from "./helpers/db";
import { appTheme } from './AppTheme';
import { GoogleLogin } from 'react-google-login';
import { MuiThemeProvider, createMuiTheme, makeStyles, withStyles } from '@material-ui/core/styles'; // v1.x

import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import MenuIcon from '@material-ui/icons/Menu';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Hidden from '@material-ui/core/Hidden';

// TODO: use AsyncStorage instead of localStorage - https://github.com/react-native-community/async-storage

function TabContainer(props) {
  return (
    <div>
      {props.children}
    </div>
  );
}

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
});

// const useStyles = makeStyles(theme => ({
//   root: {
//     flexGrow: 1,
//     backgroundColor: theme.palette.background.paper,
//   },
// }));

function Login(props) {
  const responseGoogle = async (response) => {
    console.log(response);
    if (!response || !response.profileObj || !response.profileObj.email) {
      console.log("Error while signing in, email could not be found.");
      return;
    }
    await getCookie(response.tokenId);
    const email = response.profileObj.email;
    const name = response.profileObj.name;
    var response = await getUserDetails(email);
    var userDetails
    if (response.status === 404) {
      const createUserResponse = await createUser(email, name);
      if (createUserResponse.status !== 200) {
        props.handleLogout()
        return
      }
      userDetails = await createUserResponse['data']
    } else if (response.status === 200) {
      userDetails = await response['data']
    } else {
      // 401, 500
      props.handleLogout()
      return
    }
    if (!userDetails) {
      console.log("ERROR: While logging in [" + userDetails + "]")
      return
    }
    const userDetailsStr = JSON.stringify(userDetails);
    localStorage.setItem('userDetails', userDetailsStr);
    props.setUserDetails(userDetails);
    props.setContent("home");
  }

  return (
    <div>
      <div className="login">
        <h1 className="text-center">
          Home-Keeper
        </h1>
        <div className="login-content">
          <h2 className="text-center">
            Login
          </h2>
          <div className="content-text text-center">
            Currently the only available way to sign in is by signing in with you Google account.
          </div>
          <div className="content-center">
            <GoogleLogin 
              clientId={process.env.WEBAPP_CLIENT_ID}
              buttonText="Sign in with Google"
              onSuccess={responseGoogle}
              onFailure={responseGoogle}
              cookiePolicy={'single_host_origin'}
            />
          </div>
          <div className="content-text content-small text-center">
            Only the email is used for the sole pupose of peronalizing the app. No spam will be sent and your details will not be passed to any third party.
          </div>
        </div>
      </div>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: "home",
      userDetails: null,
      anchorEl: null
    }
  }

  handleMenu = (event) => {
    this.setState({anchorEl: event.currentTarget});
  }

  handleClose = () => {
    this.setState({anchorEl: null});
  }

  handleLogout = async () => {
    localStorage.clear();
    await revokeCookie();
    this.setState({ anchorEl: null, userDetails: null, content: "login" });
  }

  handleDeleteUser = async () => {
    const body = await deleteUser();
    if (!body) {
      console.log("ERROR: User could not be deleted.");
      return;
    }
    await revokeAllCookies();
    await this.handleLogout();
  }

  handleGithub = () => {
    location.href = "https://www.github.com/ofekp/homekeeper";
  }

  setUserDetails = (userDetails) => {
    this.setState(() => ({
      userDetails: userDetails
    }))
  }

  setContent = (content) => {
    this.setState(() => ({
      content: content
    }))
  }

  componentWillMount() {
    const userDetails = localStorage.getItem('userDetails');
    this.setState(() => ({
      userDetails: userDetails,
    }));
  }

  render() {
    const {classes} = this.props;
    const open = Boolean(this.state.anchorEl);

    return (
      <div >
        <MuiThemeProvider theme={appTheme}>
        <AppBar position="static">
          <Grid
            justify="space-between"
            container 
            spacing={0}
          >
            <Grid item>
              <Tabs value={this.state.content !== "login" ? this.state.content : false} onChange={(event, newValue) => { this.setState({content: newValue}) }}>
                <Tab value="home" label="Home" />
                <Tab value="devices" label="Devices" />
                <Tab value="risco_login" label="Risco Login" />
              </Tabs>
            </Grid>

            <Grid item>
              {this.state.userDetails ?
                (<div style={{ flex: 1 }}>
                <IconButton
                  aria-label="Account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={this.handleMenu}
                  color="inherit"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={this.state.anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={open}
                  onClose={this.handleClose}
                >
                  <MenuItem onClick={this.handleLogout}>Sign out</MenuItem>
                  <MenuItem onClick={this.handleDeleteUser}>Delete My Account</MenuItem>
                </Menu>
                <IconButton 
                  aria-label="Account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={this.handleGithub}
                  color="inherit">
                  <svg className="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"></path></svg>
                </IconButton>
                </div>)
                :
                (<div className="loging-container">
                  <Button color="inherit" onClick={(event, newValue) => { this.setState({content: "login"}) }}>Login</Button >
                </div>)
              }
            </Grid>
          </Grid>
        </AppBar>
        </MuiThemeProvider>
        {this.state.content === 'login' && <TabContainer><Login setUserDetails={this.setUserDetails} setContent={this.setContent} handleLogout={this.handleLogout}/></TabContainer>}
        {this.state.content === 'home' && <TabContainer><Home /></TabContainer>}
        {this.state.content === 'devices' && <TabContainer><Devices handleLogout={this.handleLogout} /></TabContainer>}
        {this.state.content === 'risco_login' && <TabContainer><RiscoLogin handleLogout={this.handleLogout} /></TabContainer>}
        <div className="footer">
          Home-Keeper by Ofek Pearl
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(App);
