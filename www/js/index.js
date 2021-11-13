// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function perc(num) {
    return num/100;
}

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + window.cordova.platformId + '@' + window.cordova.version);

    $('#debugValuesDisplayToggle').on('click', function () {
        toggleDisplayDebugValues();
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

        // Initialize form validation on the registration form.
        $('form#calxForm').validate({
            // Specify validation rules
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
                    range: [1, 99999],
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
            // Specify validation error messages
            messages: {
                XXX: {
                    XXX: _ERR_MSG_DOLLAR,
                },
                YYY: 'YYY',
            },
            // Make sure the form is submitted to the destination defined
            // in the "action" attribute of the form when valid
            submitHandler: function (form) {
                onPressCalculate();
            }
        }); //END: `$(...).validate(...)`

        $('form#calxForm').calx({
            data: {
                /* beautify ignore:start */
                // Pricing as of 6/11/21
                J5:  {value: ''},  K5:  {value: perc(50)},    L5:  {value: perc(55)},    M5:  {value: perc(60)},    N5:  {value: perc(65)},    O5:  {value: perc(70)},    P5:  {value: perc(75)},    Q5:  {value: perc(80)},
                J6:  {value: 760}, K6:  {value: perc(3.999)}, L6:  {value: perc(4.125)}, M6:  {value: perc(4.250)}, N6:  {value: perc(4.250)}, O6:  {value: perc(4.375)}, P6:  {value: perc(4.500)}, Q6:  {value: perc(4.625)},
                J7:  {value: 740}, K7:  {value: perc(4.125)}, L7:  {value: perc(4.250)}, M7:  {value: perc(4.375)}, N7:  {value: perc(4.375)}, O7:  {value: perc(4.500)}, P7:  {value: perc(4.625)}, Q7:  {value: perc(4.750)},
                J8:  {value: 720}, K8:  {value: perc(4.250)}, L8:  {value: perc(4.375)}, M8:  {value: perc(4.500)}, N8:  {value: perc(4.500)}, O8:  {value: perc(4.625)}, P8:  {value: perc(4.750)}, Q8:  {value: perc(4.999)},
                J9:  {value: 700}, K9:  {value: perc(4.375)}, L9:  {value: perc(4.500)}, M9:  {value: perc(4.625)}, N9:  {value: perc(4.750)}, O9:  {value: perc(4.875)}, P9:  {value: perc(4.999)}, Q9:  {value: perc(5.250)},
                J10: {value: 680}, K10: {value: perc(4.500)}, L10: {value: perc(4.625)}, M10: {value: perc(4.750)}, N10: {value: perc(4.875)}, O10: {value: perc(5.125)}, P10: {value: perc(5.250)}, Q10: {value: perc(5.625)},
                J11: {value: 660}, K11: {value: perc(4.875)}, L11: {value: perc(4.999)}, M11: {value: perc(5.125)}, N11: {value: perc(5.375)}, O11: {value: perc(5.625)}, P11: {value: perc(5.625)}, Q11: {value: perc(6.250)},
                J12: {value: 640}, K12: {value: perc(5.250)}, L12: {value: perc(5.375)}, M12: {value: perc(5.500)}, N12: {value: perc(5.750)}, O12: {value: perc(5.999)}, P12: {value: perc(6.250)}, Q12: {value: perc(6.875)},
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
            // onAfterCalculate: function () { /* do the process here */ }
        });
    });
}//END: `onDeviceReady`

function setSignupCompleted(isSignupCompleted) {
    console.log('Storing "isSignupCompleted" value: ' + isSignupCompleted);
    window.localStorage.setItem('isSignupCompleted', ''+isSignupCompleted);
}

function isSignupCompleted() {
    var isSignupCompleted = window.localStorage.getItem('isSignupCompleted') === 'true';
    return isSignupCompleted;
}

function alertNoSignupYet() {
    navigator.notification.alert('Looks like you haven\'t signed in before. Once you sign in, you can view and print your results in the app.');
}

function sendLocalNotification() {
    window.cordova.plugins.notification.local.schedule({
        title: 'Thanks',
        text: 'Hope you found the app useful! Be sure to check out our other calculator apps!',
        foreground: true,
    });
}

function onPressCalculate() {
    if (device.platform.toLowerCase() === 'ios') {
        if (!isSignupCompleted()) {
            alertNoSignupYet();
            window.cordova.plugins.SignInWithApple.signin(
                {
                    requestedScopes: [
                        0, // FullName
                        1, // Email
                    ]
                },
                function (succ) {
                    var decodedObj = jwt_decode(succ.identityToken);
                    console.log('Apple login succeeded.\nRaw response: ' + JSON.stringify(succ) + '\nDecoded JWT: ' + JSON.stringify(decodedObj));
                    setSignupCompleted(true);
                    toggleDisplayOutputValues(true);
                    sendToHubspot(decodedObj.email, decodedObj.fullName.givenName, decodedObj.fullName.familyName);
                },
                function (err) {
                    console.error('Apple login failed: ' + JSON.stringify(err));
                    switch (err.code) {
                        case '1001': // ASAuthorizationErrorCanceled (user cancelled)
                        case '1003': // ASAuthorizationErrorNotHandled (user cancelled)
                            //TODO: Sorry we won't let you have the results. They can try again
                            setSignupCompleted(false);
                            toggleDisplayOutputValues(false);
                            navigator.notification.alert('Sorry, please try pressing the "Calculate" button again.');
                            break;
                        case '1000': // ASAuthorizationErrorUnknown (authorization attempt failed for an unknown reason)
                        case '1002': // ASAuthorizationErrorInvalidResponse (authorization request received an invalid response.)
                        default:     // Unknown error code returned from Apple
                            //TODO: We'll let them have the results BUT we won't persist the flag that they registered
                            setSignupCompleted(false);
                            toggleDisplayOutputValues(true);
                            break;
                    }
                }
            );//END: `plugins.SignInWithApple.signin`
        }//END: `if (!isSignupCompleted())`
    }
    else if (device.platform.toLowerCase() === 'android') {
        if (!isSignupCompleted()) {
            alertNoSignupYet();
            window.cordova.plugins.googleplus.login(
                {
                    'scopes': 'profile email', // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`.
                    'webClientId': 'com.googleusercontent.apps.1060980760645-q1ugnupkteqo64n34e2kaomrq61m23hd', // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
                    //   'offline': true // optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
                },
                function (obj) {
                    console.log('Google login succeeded: ' + JSON.stringify(obj));
                    toggleDisplayOutputValues(true);
                    sendToHubspot(obj.email, obj.givenName, obj.familyName);
                },
                function (msg) {
                    navigator.notification.alert('Google login failed: ' + msg);
                    toggleDisplayOutputValues(false);
                }
            );//END: `plugins.googleplus.login`
        }//END: `if (!isSignupCompleted())`
    }
    else if (device.platform.toLowerCase() === 'browser') {
        //XXX TODO: handle web browser case
        sendToHubspot(
            window.prompt('Email address') || 'ryan+testuser@fake.com',
            window.prompt('First name') || 'Ryan Test',
            window.prompt('Last name') || 'User'
        );
        toggleDisplayOutputValues(true);
    }
    else {
        navigator.notification.alert('Unexpected device.platform: ' + device.platform);
    }
}

function toggleDisplayOutputValues(/*optional*/show) {
    if (typeof show === 'undefined') {
        console.log('Now toggling output values.');
        $('#outputValuesContainer').toggle();
    }
    else {
        console.log('Now ' + (show ? 'showing' : 'hiding') + ' output values.');
        $('#outputValuesContainer')[show ? 'show' : 'hide']();
    }
}

function toggleDisplayDebugValues(/*optional*/show) {
    if (typeof show === 'undefined') {
        console.log('Now toggling debug values.');
        $('#debugValuesContainer').toggle();
    }
    else {
        console.log('Now ' + (show ? 'showing' : 'hiding') + ' debug values.');
        $('#debugValuesContainer')[show ? 'show' : 'hide']();
    }
}

function sendToHubspot(email, firstname, lastname) {
    var portalId = '20494112';
    var formGuid = '34c828b3-74fc-47bb-b42a-5978f82e7d80';
    // var nameTokens = fullname.split(' ');
    // var firstname = nameTokens[0];
    // var lastname = '';
    // if (nameTokens.length > 1) {
    //     if (nameTokens.length === 2) {
    //         lastname = nameTokens[1];
    //     }
    //     else {
    //         lastname = nameTokens.slice(1).join(' ');
    //     }
    // }

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
        sendLocalNotification();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to send registration data to Hubspot: ' + errorThrown);
        //No recourse
    }).always(function () {
        //...
    });
}