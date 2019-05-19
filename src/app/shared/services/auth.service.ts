import {Injectable, NgZone} from '@angular/core';
import {User} from '../services/user';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  isAdmin: boolean;
  CheckRole: any;
  public items: Array<any> = [];

  userData: any; // Save logged in user data

  constructor(
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    });
  }

  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null && user.emailVerified !== false) ? true : false;
  }
  ngOnit() {
    this.getData();
  }

  getData() {
    return this.afs.collection('users').doc(this.userData.uid).collection('Roles').snapshotChanges()
      .subscribe(result => {
        this.items = result;
        for (const item of this.items) {
          this.CheckRole = item.payload.doc.data();
        }
      });
  }

  // Sign in with email/password
  SignIn(email, password) {


    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.ngZone.run(() => {
          if (this.CheckRole === 'admin') {
            this.isAdmin = true;
            this.router.navigate(['dashboard']);
          } else {
            this.isAdmin = false;
            this.router.navigate(['dashboard']);
          }
        });
        this.SetUserData(result.user);
        this.getData();
        console.log(this.items);
      }).catch((error) => {
        window.alert(error.message);
      });
  }

  // Sign up with email/password
  SignUp(email ) {

    var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    password = "";
for (var i = 0, n = charset.length; i < length; ++i) {
  password += charset.charAt(Math.floor(Math.random() * n));
}
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        /* Call the SendVerificaitonMail() function when new user sign
        up and returns promise */
        this.SendVerificationMail(email);
        this.SetUserData(result.user);
      }).catch((error) => {
        window.alert(error.message);
      });
  }

  // Reset Forggot password

  // Send email verfificaiton when new user sign up
  SendVerificationMail(passedEmail) {
    return this.afAuth.auth.sendPasswordResetEmail(passedEmail)
      .then(() => {
        this.router.navigate(['verify-email-address']);
      });
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((result) => {
        this.ngZone.run(() => {
          this.router.navigate(['dashboard']);
        });
        this.SetUserData(result.user);
      }).catch((error) => {
        window.alert(error);
      });
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user) {
    console.log(this.items[1], 'Role:' + this.CheckRole);
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
    return userRef.set(userData, {
      merge: true
    });
  }

  // Sign out
  SignOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['sign-in']);
    });
  }


  goReg(){
    this.router.navigate(['register-user']);
  }
}
