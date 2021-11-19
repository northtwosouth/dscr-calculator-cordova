(function ($, window, undefined) {

    function _setSignupCompleted(isSignupCompleted) {
        console.log('Storing "isSignupCompleted" value: ' + isSignupCompleted);
        window.localStorage.setItem('isSignupCompleted', ''+isSignupCompleted);
    }

    function _isSignupCompleted() {
        var isSignupCompleted = window.localStorage.getItem('isSignupCompleted') === 'true';
        return isSignupCompleted;
    }

    function _alertSignupFailed() {
        _setSignupCompleted(false);
        _toggleDisplayOutputValues(false);
        navigator.notification.alert('Sorry, you\'ll need to register to see your results. Press the "Calculate" button again to register!');
    }

    //XXX BEGIN: TODO - Not used yet
    function _alertNeedsSignup(fnCallback) {
        navigator.notification.alert(
            'Looks like you haven\'t signed in before. Once you sign in, you can view and print your results in the app.',
            fnCallback
        );
    }

    function _scheduleLocalNotification() {
        window.cordova.plugins.notification.local.schedule({
            title: 'Thanks!',
            text: 'Hope you found our DSCR calculator useful! Be sure to check out our other resources, and don\'t hesitate to call us at 888-878-7715 with any questions!',
            foreground: true,
            trigger: {
                in: 1,
                unit: 'hour',
            },
        });
    }
    //XXX END: TODO - Not used yet

    function __toggleDisplayValuesElem(selector, /*optional*/show) {
        var $elem = $(selector);

        if (typeof show === 'undefined') {
            console.log('Now toggling "' + selector + '".');
            show = $elem.toggle().is(':visible');
        }
        else {
            console.log('Now ' + (show ? 'showing' : 'hiding') + ' "' + selector + '".');
            $elem[show ? 'show' : 'hide']();
        }

        if (show) {
            $elem[0].scrollIntoView({ behavior: 'smooth' });
        }
        return show;
    }

    function _toggleDisplayOutputValues(/*optional*/show) {
        return __toggleDisplayValuesElem('#outputValuesContainer', show);
    }

    function _toggleDisplayDebugValues(/*optional*/show) {
        return __toggleDisplayValuesElem('#debugValuesContainer', show);
    }

    function _sendToHubspot(email, firstname, lastname) {
        var portalId = '20494112';
        var formGuid = '34c828b3-74fc-47bb-b42a-5978f82e7d80';

        console.log('Sending registration data to Hubspot...');

        $.ajax({
            url: 'https://forms.hubspot.com/uploads/form/v2/' + portalId + '/' + formGuid,
            method: 'POST',
            data: {
                email: email,
                firstname: firstname,
                lastname: lastname,
            },
        }).done(function (response, textStatus, jqXHR) {
            console.log('Registration data successfully sent to Hubspot.');
            //_scheduleLocalNotification();
            _setSignupCompleted(true);
            _toggleDisplayOutputValues(true);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Failed to send registration data to Hubspot: ' + errorThrown);
            //XXX TODO: No other recourse here?
            _setSignupCompleted(false);
            _toggleDisplayOutputValues(false);
        }).always(function () {
            //...
        });
    }//END: `_sendToHubspot()`

    function _attemptSignInWithApple() {
        window.cordova.plugins.SignInWithApple.signin(
            {
                requestedScopes: [
                    0, // FullName
                    1, // Email
                ]
            },
            function (succ) {
                var decodedObj = jwt_decode(succ.identityToken);//Only needed when email-masking is used
                console.log('Apple login succeeded!');
                console.debug('Raw response: ' + JSON.stringify(succ) + '\nDecoded JWT: ' + JSON.stringify(decodedObj));
                _sendToHubspot(
                    succ.email || decodedObj.email,
                    succ.fullName.givenName,
                    succ.fullName.familyName
                );
            },
            function (err) {
                console.error('Apple login failed: ' + JSON.stringify(err));
                switch (err.code) {
                    case '1001': // ASAuthorizationErrorCanceled (user cancelled)
                    case '1003': // ASAuthorizationErrorNotHandled (user cancelled)
                        _alertSignupFailed();
                        break;
                    case '1000': // ASAuthorizationErrorUnknown (authorization attempt failed for an unknown reason)
                                 // **NOTE: Apple seems to return 1000 when user hasn't logged in on their phone before
                                 // and the user presses the 'Settings' button to setup Apple ID for the first time.**
                        _setSignupCompleted(false);
                        _toggleDisplayOutputValues(true);
                        //XXX TODO: Do we need to `_alertSignupFailed`?
                        break;
                    case '1002': // ASAuthorizationErrorInvalidResponse (authorization request received an invalid response.)
                    default:     // Unknown error code returned from Apple
                        //TODO: We'll let them have the results BUT we won't persist the flag that they registered
                        _setSignupCompleted(false);
                        _toggleDisplayOutputValues(true);
                        break;
                }
            }
        );//END: `plugins.SignInWithApple.signin`
    }//END: `_attemptSignInWithApple()`

    function _attemptSignInWithGoogle() {
        window.plugins.googleplus.login(//NOTE: Yes, this plugin uses the old `window.plugins` Cordova global
            {
                'scopes': 'profile email', // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`.
                'webClientId': '711934747211-9jiqn8i1klq69sodg7ds2td7nt5t6mgu.apps.googleusercontent.com', // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
                //   'offline': true // optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
            },
            function (obj) {
                console.log('Google login succeeded: ' + JSON.stringify(obj));
                _sendToHubspot(
                    obj.email,
                    obj.givenName,
                    obj.familyName
                );
            },
            function (msg) {
                navigator.notification.alert('Google login failed: ' + msg);
                _alertSignupFailed();
            }
        );//END: `plugins.googleplus.login`
    }//END: `_attemptSignInWithGoogle()`

    function _toPercent(num) {
        return num/100;
    }

    //
    // Wait for the deviceready event before using any of Cordova's device APIs.
    // See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
    //
    document.addEventListener('deviceready', function () {
        console.log('Running cordova-' + window.cordova.platformId + '@' + window.cordova.version);

        $('#debugValuesDisplayToggle').on('click', function () {
            _toggleDisplayDebugValues();
        });

        $(function () {
            var _ERR_MSG_PERCENT = 'Please enter a valid percentage (up to two decimal places)';
            var _ERR_MSG_DOLLAR = 'Please enter a valid dollar amount';
            var _OPTS_PERCENT = {
                required: true,
                range: [0, 100],
                // pattern: _REGEX_PERCENT,
                step: 0.01,
            };
            var _OPTS_DOLLAR_AMT = {
                required: true,
                currency: ['$', false], // dollar sign optional
                // number: true,
                // step: 0.01,
                // min: 0,
            };
            var _OPTS_DOLLAR_AMT_OPTIONAL = {
                required: false,
                currency: ['$', false], // dollar sign optional
                // number: true,
                // step: 0.01,
                // min: 0,
            };

            // override jquery validate plugin defaults
            $.validator.setDefaults({
                errorElement: "span",
                errorClass: "help-block",
                highlight: function (element, errorClass, validClass) {
                    // Only validation controls
                    if (!$(element).hasClass('novalidation')) {
                        // $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
                        $(element).parent().removeClass('has-success').addClass('has-error');
                    }
                },
                unhighlight: function (element, errorClass, validClass) {
                    // Only validation controls
                    if (!$(element).hasClass('novalidation')) {
                        // $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
                        $(element).parent().removeClass('has-error').addClass('has-success');
                    }
                },
                errorPlacement: function (error, element) {
                    if (element.parent('.input-group').length) {
                        error.insertAfter(element.parent());
                    } else if (element.prop('type') === 'radio' && element.parent('.radio-inline').length) {
                        error.insertAfter(element.parent().parent());
                    } else if (element.prop('type') === 'checkbox' || element.prop('type') === 'radio') {
                        error.appendTo(element.parent().parent());
                    } else {
                        error.insertAfter(element);
                    }
                }
            }); //END: `$.validator.setDefaults(...)`

            // Prevent form submissions on <Enter> key
            $('form#calxForm').bind('keypress', function (event) {
                if (event.keyCode === 13) {
                    return false;
                }
            });

            // Initialize form validation plugin
            $('form#calxForm').validate({
                // Define validation rules
                rules: {
                    borrowerName: {
                        required: true,
                    },
                    propertyAddress1: {
                        required: true,
                    },
                    propertyAddress2: {
                        required: true,
                    },
                    ficoScore: {
                        required: true,
                        digits: true,
                        min: 640,
                        max: 850,
                    },
                    numUnits: {
                        required: true,
                        digits: true,
                        range: [1, 4],
                    },
                    purposeOfLoan: {
                        required: true,
                    },
                    valueBorrowerPrimary: _OPTS_DOLLAR_AMT,
                    valueSubjectProperty: _OPTS_DOLLAR_AMT,
                    proposedLoanAmt: _OPTS_DOLLAR_AMT,
                    subjectPropertyEstMonthlyRent: _OPTS_DOLLAR_AMT,
                    subjectPropertyEstMonthlyInsur: _OPTS_DOLLAR_AMT,
                    subjectPropertyEstMonthlyPropTaxes: _OPTS_DOLLAR_AMT,
                    optMonthlyHoaDues: _OPTS_DOLLAR_AMT_OPTIONAL,
                    chkInterestOnlyDesired: {},
                    chkUseNoRatioInstead: {},
                    // outLtvRatio: _OPTS_PERCENT,
                    // outEstIntRate: _OPTS_PERCENT,
                    // outPrincipalAndInterest: _OPTS_DOLLAR_AMT,
                    // outSubjectPiti: _OPTS_DOLLAR_AMT,
                },
                // Define validation error messages
                messages: {
                    XXX: {
                        XXX: _ERR_MSG_DOLLAR,
                    },
                    YYY: 'YYY',
                },
                // Called when form `submit` button fired
                submitHandler: function (form) {
                    var email,
                        firstName,
                        lastName;

                    if (_isSignupCompleted()) {
                        _toggleDisplayOutputValues(true);
                    }
                    // Otherwise signup not yet completed, so sign in based on platform
                    else if (device.platform.toLowerCase() === 'ios') {
                        //_alertNeedsSignup(_attemptSignInWithApple);//XXX Too many dialogs
                        _attemptSignInWithApple();
                    }
                    else if (device.platform.toLowerCase() === 'android') {
                        //_alertNeedsSignup(_attemptSignInWithGoogle);//XXX Too many dialogs
                        _attemptSignInWithGoogle();
                    }
                    else if (device.platform.toLowerCase() === 'browser') {
                        // Yes, we can use `window.prompt` here
                        if (
                            !(email = window.prompt('Please enter your email address')) ||
                            !(firstName = window.prompt('Please enter your first name')) ||
                            !(lastName = window.prompt('Please enter your last name'))
                        ) {
                            _alertSignupFailed();
                        }
                        else {
                            _sendToHubspot(email, firstName, lastName);
                        }
                    }
                    else {
                        navigator.notification.alert('Unexpected `device.platform`: ' + device.platform);
                        //TODO: should we be lenient (and silent) here???
                    }
                },//END: `submitHandler`
            });//END: `$(...).validate()`

            $('form#calxForm').calx({
                data: {
                    /* beautify ignore:start */
                    // Pricing as of 6/11/21
                    J5:  {value: ''},  K5:  {value: _toPercent(50)},    L5:  {value: _toPercent(55)},    M5:  {value: _toPercent(60)},    N5:  {value: _toPercent(65)},    O5:  {value: _toPercent(70)},    P5:  {value: _toPercent(75)},    Q5:  {value: _toPercent(80)},
                    J6:  {value: 760}, K6:  {value: _toPercent(3.999)}, L6:  {value: _toPercent(4.125)}, M6:  {value: _toPercent(4.250)}, N6:  {value: _toPercent(4.250)}, O6:  {value: _toPercent(4.375)}, P6:  {value: _toPercent(4.500)}, Q6:  {value: _toPercent(4.625)},
                    J7:  {value: 740}, K7:  {value: _toPercent(4.125)}, L7:  {value: _toPercent(4.250)}, M7:  {value: _toPercent(4.375)}, N7:  {value: _toPercent(4.375)}, O7:  {value: _toPercent(4.500)}, P7:  {value: _toPercent(4.625)}, Q7:  {value: _toPercent(4.750)},
                    J8:  {value: 720}, K8:  {value: _toPercent(4.250)}, L8:  {value: _toPercent(4.375)}, M8:  {value: _toPercent(4.500)}, N8:  {value: _toPercent(4.500)}, O8:  {value: _toPercent(4.625)}, P8:  {value: _toPercent(4.750)}, Q8:  {value: _toPercent(4.999)},
                    J9:  {value: 700}, K9:  {value: _toPercent(4.375)}, L9:  {value: _toPercent(4.500)}, M9:  {value: _toPercent(4.625)}, N9:  {value: _toPercent(4.750)}, O9:  {value: _toPercent(4.875)}, P9:  {value: _toPercent(4.999)}, Q9:  {value: _toPercent(5.250)},
                    J10: {value: 680}, K10: {value: _toPercent(4.500)}, L10: {value: _toPercent(4.625)}, M10: {value: _toPercent(4.750)}, N10: {value: _toPercent(4.875)}, O10: {value: _toPercent(5.125)}, P10: {value: _toPercent(5.250)}, Q10: {value: _toPercent(5.625)},
                    J11: {value: 660}, K11: {value: _toPercent(4.875)}, L11: {value: _toPercent(4.999)}, M11: {value: _toPercent(5.125)}, N11: {value: _toPercent(5.375)}, O11: {value: _toPercent(5.625)}, P11: {value: _toPercent(5.625)}, Q11: {value: _toPercent(6.250)},
                    J12: {value: 640}, K12: {value: _toPercent(5.250)}, L12: {value: _toPercent(5.375)}, M12: {value: _toPercent(5.500)}, N12: {value: _toPercent(5.750)}, O12: {value: _toPercent(5.999)}, P12: {value: _toPercent(6.250)}, Q12: {value: _toPercent(6.875)},
                    /* beautify ignore:end */
                    K14: {//ABS_Score
                        formula: 'IF(C13<660,"NA",IF(AND(C13<680,C13>=660),660,IF(AND(C13<700,C13>=680),680,IF(AND(C13<700,C13>=680),680,IF(AND(C13<720,C13>=700),700,IF(AND(C13<740,C13>=720),720,IF(AND(C13<760,C13>=740),740,IF(C13>=760,760))))))))',
                    },
                    K15: {//ABS_LTV
                        formula: 'IF(C16<=0.5,0.5,IF(AND(C16<=0.55,C16>0.5),0.55,IF(AND(C16<=0.6,C16>0.55),0.6,IF(AND(C16<=0.65,C16>0.6),0.65,IF(AND(C16<=0.7,C16>0.65),0.7,IF(AND(C16<=0.75,C16>0.7),0.75,IF(AND(C16<=0.8,C16>0.75),0.8,IF(C16>0.75,"NA"))))))))',
                        format: '0%',
                    },
                    K17: {//Base_Rate  (A==>J, B==>K, ...)
                        // See also: https://www.ablebits.com/office-addins-blog/2019/12/17/index-match-match-two-dimensional-lookup-excel#sumproduct
                        //
                        // formula: 'MATCH(K14,J6:J12,-1)',
                        // formula: 'MATCH(K15,K5:Q5,1)',
                        formula: 'INDEX(K6:Q12, MATCH(K14,J6:J12,-1), MATCH(K15,K5:Q5,1))',
                        //
                        //           SUMPRODUCT(vlookup_col_range = vlookup_value) * (hlookup_row_range = hlookup_value) * data_array)
                        // formula: 'SUMPRODUCT( (J6:J12=K14) * (K5:Q5=K15) * K6:Q12 )',
                        //
                        //           VLOOKUP(vlookup_value, table_array, MATCH(hlookup_value, hlookup_row_range, 0), FALSE)
                        // formula: 'VLOOKUP(K14, K6:Q12, MATCH(K15, K5:Q5, 0), FALSE)',
                        format: '0.000%',
                    },
                    K19: {//TWO_to_FOUR_Units
                        formula: 'IF(C14>=2,0.25%,0)',
                        format: '0.000%',
                    },
                    K20: {//IO
                        formula: 'IF(E19="Yes",0.25%,0)',
                        format: '0.000%',
                    },
                    K21: {//No_DSCR
                        formula: 'IF(E20="Yes",0.25%,0)',
                        format: '0.000%',
                    },
                    K22: {//CashOut
                        formula: 'IF(C15="Cashout",0.25%,0)',
                        format: '0.000%',
                    },
                    K23: {//Net_BPC_Rate
                        formula: '+K17+SUM(K19:K22)',
                        format: '0.000%',
                    },
                    K24: {//LPC_Add
                        formula: 'IF(C18>0.02,0.01,+C18/2)',
                        format: '0.000%',
                    },
                    K25: {//Net_LPC_Rate
                        formula: '+K23+K24',
                        format: '0.000%',
                    },
                },//END: `data`
                // onAfterCalculate: function () { /* ... */ }
            });//END: `$(...).calx()`
        });
    }, false);//END: `deviceready`
})(jQuery, window);