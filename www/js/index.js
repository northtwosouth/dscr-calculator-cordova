(function ($, window, undefined) {

    var _HS_PORTAL_ID = '20494112';

    function _checkForPassFail(/*optional*/force) {
        var errArr = [];
        var ficoScore = $('#ficoScore').val();
        var isCashOut = $('#purposeOfLoan').val() === 'Cashout';
        var minFico = isCashOut ? 680 : 700;
        var maxLtvWithDscr = isCashOut ? 70 : 75;
        var maxLtv = 85;
        var outDscrValue = $('#outDscrValue').val();
        var hasFormErrors = !$('form#calxForm').valid();

        if (!force && !$('#outputValuesContainer').is(':visible')) {
            return; // Halt immediately
        }

        var outLtvRatio = parseFloat( $('#outLtvRatio').val() );
        if (outLtvRatio > parseFloat(maxLtv)) {
            errArr.push('The maximum LTV ratio is ' + maxLtv + '%');
        }
        
        console.log('_checkForPassFail()', 'outDscrValue: ' + outDscrValue +
            ' ; ficoScore: ' + ficoScore +
            ' ; outLtvRatio: ' + outLtvRatio
        );
        console.log('_checkForPassFail()', 'isCashOut: ' + isCashOut +
            ' ; minFico: ' + minFico +
            ' ; maxLtvWithDscr: ' + maxLtvWithDscr
        );

        var isDscrUnder1 = parseFloat(outDscrValue) < 1;
        var isBelowMinFico = parseInt(ficoScore) < minFico;
        var isAboveMaxLtv = outLtvRatio > maxLtvWithDscr;

        var $dscrErrBlockElem = $('#outDscrValue_ErrBlock');
        if (isDscrUnder1 && isBelowMinFico) {
            errArr.push('When FICO Score is less than ' + minFico + ', the minimum acceptable DSCR is 1.00');
        }
        else if (isDscrUnder1 && isAboveMaxLtv) {
            errArr.push('When LTV is greater than ' + maxLtvWithDscr + '%, the minimum acceptable DSCR is 1.00');
        }

        var hasErrorList = !!errArr.length;
        if (hasErrorList) {
            $dscrErrBlockElem.html('<ul class="list-unstyled">' + errArr.map(function (errMsg) {
                return '<li><i class="fa fa-exclamation-triangle mr-5" aria-hidden="true"></i>' + errMsg + '.</li>';//Period at end of each list item
            }).join('') + '</ul>');
        }
        console.log('_checkForPassFail()', 'hasFormErrors ==> ' + hasFormErrors +
            '\nhasErrorList ==> ' + hasErrorList +
            '\nerrArr:\n- ' + errArr.join('\n - '));
        $dscrErrBlockElem[hasErrorList ? 'show' : 'hide']();
        var $outValuesElem = $('#outputValuesContainer');
        $outValuesElem[hasErrorList ? 'addClass' : 'removeClass']('panel-danger alert-danger');
        $outValuesElem[hasErrorList ? 'removeClass' : 'addClass']('panel-success alert-success');
        var $outPanelBodyElem = $('#outputValuesContainer .panel-body');
        $outPanelBodyElem[hasErrorList ? 'addClass' : 'removeClass']('bg-danger');
        $outPanelBodyElem[hasErrorList ? 'removeClass' : 'addClass']('bg-success');

        $('#outDescPass')[hasErrorList ? 'hide' : 'show']();
        $('#outDescFail')[hasErrorList ? 'show' : 'hide']();
        $('#bypassDscrSponsorContainer')[hasErrorList ? 'show' : 'hide']();

        $('#outDscrFormGroup')[hasErrorList ? 'addClass' : 'removeClass']('has-error');

        // Special case: if form validation fails later after already submitted, we need to hide manually
        if (hasFormErrors) {
            _toggleDisplayOutputValues(false);
        }

        // Note here that we're merely prepping the inner button's visiblity (the outer section
        // container will be handled in the form `submitHandler`).
        $('#emailMyResultsBtnContainer')[hasErrorList ? 'hide' : 'show']();
        $('#emailMyResultsFormContainer').hide();//Upon each DSCR validation, reset result form to hidden
    }//END: `_checkForPassFail`

    function _setSignupCompleted(isSignupCompleted, /*optional*/signupPayload) {
        console.log('Storing "isSignupCompleted" value: ' + isSignupCompleted);
        window.localStorage.setItem('isSignupCompleted', ''+isSignupCompleted);
        if (isSignupCompleted) {
            console.log('Storing `signupPayload`: ' + JSON.stringify(signupPayload));
            window.localStorage.setItem('dscr_firstname', ''+signupPayload.firstname);
            window.localStorage.setItem('dscr_lastname', ''+signupPayload.lastname);
            window.localStorage.setItem('dscr_email', ''+signupPayload.email);
        }
        else {
            window.localStorage.removeItem('dscr_firstname');
            window.localStorage.removeItem('dscr_lastname');
            window.localStorage.removeItem('dscr_email');
        }
    }

    function _isSignupCompleted() {
        var isSignupCompleted = window.localStorage.getItem('isSignupCompleted') === 'true';
        return isSignupCompleted;
    }

    function _alertSignupFailed() {
        _setSignupCompleted(false);
        _toggleDisplayOutputValues(false);
        //navigator.notification.alert('Sorry, you\'ll need to register to see your results. Press the "Calculate" button again to register!');
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
        __toggleDisplayValuesElem('#outputValuesContainer', show);
        $('#emailMyResultsSection')[show ? 'show' : 'hide']();
        if (show) {
            // Prepopulate "Email My Results" step with results (as hidden fields)
            $('#emr_hiddenLtv'         ).val( $('#outLtvRatio').val()             );
            $('#emr_hiddenIntRate'     ).val( $('#outEstIntRate').val()           );
            $('#emr_hiddenPrincIntRate').val( $('#outPrincipalAndInterest').val() );
            $('#emr_hiddenPiti'        ).val( $('#outSubjectPiti').val()          );
            $('#emr_hiddenDscrRatio'   ).val( $('#outDscrValue').val()            );
        }
        return show;
    }

    function _toggleDisplayDebugValues(/*optional*/show) {
        return __toggleDisplayValuesElem('#debugValuesContainer', show);
    }

    function _sendLoginToHubspot(email, firstname, lastname) {
        var formGuid = '34c828b3-74fc-47bb-b42a-5978f82e7d80';
        var payload = {
            email: email,
            firstname: firstname,
            lastname: lastname,
        };

        console.log('Sending registration data to Hubspot...');

        $.ajax({
            url: 'https://forms.hubspot.com/uploads/form/v2/' + _HS_PORTAL_ID + '/' + formGuid,
            method: 'POST',
            data: payload,
        }).done(function (response, textStatus, jqXHR) {
            console.log('Registration data successfully sent to Hubspot.');
            //_scheduleLocalNotification();
            _setSignupCompleted(true, payload);
            _toggleDisplayOutputValues(true);
            _closeAuthModal();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Failed to send registration data to Hubspot: ' + errorThrown);
            //XXX TODO: No other recourse here?
            _setSignupCompleted(false);
            _toggleDisplayOutputValues(false);
        }).always(function () {
            gtag('event', 'conversion', {
                'send_to': 'AW-932138238/W9CXCJCR9pcDEP6ZvbwD',
                'event_callback': function () {
                    console.log('Gtag AW conversion logging completed.');
                },
            });
            // Prepopulate "Email My Results" step with login info
            $('#emr_firstName').val(firstname);
            $('#emr_lastName').val(lastname);
            $('#emr_email').val(email);
        });
    }//END: `_sendLoginToHubspot()`

    function _sendEmailMyResultsToHubspot() {
        var formGuid = '45330346-4b32-4024-bf21-d5cc52365edd';
        var payload = $('form#emailMyResultsForm').serializeObject();

        console.log('Sending "Email My Results" request data to Hubspot: ' + JSON.stringify(payload));

        $.ajax({
            url: 'https://forms.hubspot.com/uploads/form/v2/' + _HS_PORTAL_ID + '/' + formGuid,
            method: 'POST',
            data: payload,
        }).done(function (response, textStatus, jqXHR) {
            console.log('"Email My Results" data successfully sent to Hubspot.');
            __toggleDisplayValuesElem('#emailMyResultsSection', false);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Failed to send "Email My Results" data to Hubspot: ' + errorThrown);
            //XXX TODO: No other recourse here?
        }).always(function () {
            //...
        });
    }//END: `_sendEmailMyResultsToHubspot()`

    function _attemptSignInWithIos() {
        window.cordova.plugins.SignInWithApple.signin(
            {
                requestedScopes: [
                    0, // FullName
                    1, // Email
                ]
            },
            function (succ) {
                var decodedObj = jwt_decode(succ.identityToken);//Only needed when email-masking is used
                console.log('iOS login succeeded!');
                console.debug('Raw response: ' + JSON.stringify(succ) + '\nDecoded JWT: ' + JSON.stringify(decodedObj));
                _sendLoginToHubspot(
                    succ.email || decodedObj.email,
                    succ.fullName.givenName,
                    succ.fullName.familyName
                );
            },
            function (err) {
                console.error('iOS login failed: ' + JSON.stringify(err));
                switch (err.code) {
                    case '1001': // ASAuthorizationErrorCanceled (user cancelled)
                    case '1003': // ASAuthorizationErrorNotHandled (user cancelled)
                        _alertSignupFailed();
                        break;
                    case '1000': // ASAuthorizationErrorUnknown (authorization attempt failed for an unknown reason)
                                 // **NOTE: Apple seems to return 1000 when user hasn't logged in on their phone before
                                 // and the user presses 'Settings' buttons to setup Apple ID for the first time (or
                                 // even when he presses 'Close' instead to dismiss it).**
                        _setSignupCompleted(false);
                        _toggleDisplayOutputValues(false);
                        // But don't alert user, because he might be in the middle of configuring his phone
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
    }//END: `_attemptSignInWithIos()`

    function _attemptSignInWithAppleJs() {
        return AppleID.auth.signIn().then(function (response) {
            console.log('Apple JS login succeeded: ' + JSON.stringify(response));
            var decodedObj = jwt_decode(response.authorization.id_token);
            console.log('Raw response: ' + JSON.stringify(response) + '\nDecoded JWT: ' + JSON.stringify(decodedObj));
            _sendLoginToHubspot(
                // NOTE: `user` object only presented the first time the user authorizes the application.
                // Otherwise we fall back on JWT, which contains only the email.
                !!response.user ? response.user.email : decodedObj.email,
                !!response.user && !!response.user.name ? response.user.name.firstName : '',
                !!response.user && !!response.user.name ? response.user.name.lastName : '',
            );
        }, function (result) {
            console.error('Apple JS login failed: ' + JSON.stringify(result));
            _alertSignupFailed();
            if (result.error === 'popup_closed_by_user') {
                // Leave popup open to try again
            }
        });
    }//END: `_attemptSignInWithAppleJs()`

    function _attemptSignInWithGoogle() {
        return window.plugins.googleplus.login(//NOTE: Yes, this plugin uses the old `window.plugins` Cordova global
            {
                'scopes': 'profile email', // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`.
                'webClientId': '711934747211-9jiqn8i1klq69sodg7ds2td7nt5t6mgu.apps.googleusercontent.com', // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
                //   'offline': true // optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
            },
            function (obj) {
                console.log('Google login succeeded: ' + JSON.stringify(obj));
                _sendLoginToHubspot(
                    obj.email,
                    obj.givenName,
                    obj.familyName
                );
            },
            function (msg) {
                console.error('Google login failed: ' + msg);
                _alertSignupFailed();
            }
        );//END: `plugins.googleplus.login`
    }//END: `_attemptSignInWithGoogle()`

    function _attemptSignInWithFb() {
        // Nested helper function
        function __statusChangeCallback(response) {
            console.log('__statusChangeCallback(): ' + JSON.stringify(response));
            // the person is logged into Facebook, and has logged into your app
            if (response.status === 'connected') {
                console.log('Logged in via FB; now fetching user data...');
                FB.api('/me', {fields: 'first_name, last_name, email'}, function (response) {
                    console.log('FB.api("/me") ==> ' + JSON.stringify(response));
                    _sendLoginToHubspot(
                        response.email,
                        response.first_name,
                        response.last_name
                    );
                });
            }
            else {
                FB.login(__statusChangeCallback, {scope: 'public_profile,email'});
            }
        }//END: `__statusChangeCallback`

        //
        // BEGIN: `_attemptSignInWithFb()`
        //
        FB.getLoginStatus(__statusChangeCallback);
    }//END: `_attemptSignInWithFb()`

    function _toPercent(num) {
        return num / 100;
    }

    function _fromPercent(dec) {
        return dec * 100;
    }

    function _closeAuthModal() {
        $('#chooseAuthModal').modal('hide');
    }


    // Expose to template
    window.attemptSignInWithGoogle = _attemptSignInWithGoogle;
    window.attemptSignInWithAppleJs = _attemptSignInWithAppleJs;
    window.attemptSignInWithFb = _attemptSignInWithFb;

    //
    // Wait for the deviceready event before using any of Cordova's device APIs.
    // See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
    //
    document.addEventListener('deviceready', function () {
        console.log('Running cordova-' + window.cordova.platformId + '@' + window.cordova.version);

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
                },
            }); //END: `$.validator.setDefaults(...)`

            // Prevent form submissions on <Enter> key
            $('form#calxForm, form#emailMyResultsForm').bind('keypress', function (event) {
                if (event.keyCode === 13) {
                    return false;
                }
            });

            //
            // Initialize form validation plugin
            //

            // First, init the calculator form
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
                    propertyState: {
                        required: true,
                    },
                    ficoScore: {
                        required: true,
                        digits: true,
                        min: 660,
                        max: 850,
                    },
                    numUnits: {
                        required: true,
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
                    chkPrinAndIntPmtDesired: {},
                    chkUseNoRatioInstead: {},
                    // outLtvRatio: _OPTS_PERCENT,
                    // outEstIntRate: _OPTS_PERCENT,
                    // outPrincipalAndInterest: _OPTS_DOLLAR_AMT,
                    // outSubjectPiti: _OPTS_DOLLAR_AMT,
                    // outDscrValue: {},
                },
                // Override validation error messages
                messages: {
                    //...
                },
                // Called when form `submit` button fired
                submitHandler: function (form) {
                    console.log('BEGIN: #calxForm::submitHandler()');
                    // 1b) Check whether we pass DSCR or not (if not, get the
                    // error display ready, otherwise get success results ready).
                    _checkForPassFail(true);

                    // Show results if signup completed, otherwise prompt again
                    var email,
                        firstName,
                        lastName;

                    if (_isSignupCompleted()) {
                        _toggleDisplayOutputValues(true);
                    }
                    // Otherwise signup not yet completed, so sign in based on platform
                    else if (device.platform.toLowerCase() === 'ios') {
                        //_alertNeedsSignup(_attemptSignInWithIos);//XXX Too many dialogs
                        _attemptSignInWithIos();
                    }
                    else if (device.platform.toLowerCase() === 'android') {
                        //_alertNeedsSignup(_attemptSignInWithGoogle);//XXX Too many dialogs
                        _attemptSignInWithGoogle();
                    }
                    else if (device.platform.toLowerCase() === 'browser') {
                        $('#chooseAuthModal').modal('show');
                    }
                    else {
                        navigator.notification.alert('Unexpected `device.platform`: ' + device.platform);
                        //TODO: should we be lenient (and silent) here???
                    }
                    console.log('END: #calxForm::submitHandler()');
                },//END: `submitHandler`
            });//END: `$(...).validate()`

            // Second, init the "email my results" form
            $('form#emailMyResultsForm').validate({
                // Define validation rules
                rules: {
                    firstname: {
                        required: true,
                    },
                    lastname: {
                        required: true,
                    },
                    email: {
                        required: true,
                        email: true,
                    },
                    dscr_results_name___dscr_calculator: {
                        required: true,
                    },
                },
                // Override validation error messages
                messages: {
                    //...
                },
                // Called when form `submit` button fired
                submitHandler: function (form) {
                    _sendEmailMyResultsToHubspot();
                    return false;//Prevent us from redirecting
                },//END: `submitHandler`
            });//END: `$(...).validate()`

            $('form#calxForm').calx({
                data: {
                    /* beautify ignore:start */
                    // Pricing as of 02/24/22
                    J5:  {value: ''},  K5:  {value: _toPercent(50)},    L5:  {value: _toPercent(55)},    M5:  {value: _toPercent(60)},    N5:  {value: _toPercent(65)},    O5:  {value: _toPercent(70)},    P5:  {value: _toPercent(75)},    Q5:  {value: _toPercent(80)},
                    J6:  {value: 760}, K6:  {value: _toPercent(4.875)}, L6:  {value: _toPercent(4.875)}, M6:  {value: _toPercent(4.875)}, N6:  {value: _toPercent(4.999)}, O6:  {value: _toPercent(4.999)}, P6:  {value: _toPercent(5.250)}, Q6:  {value: _toPercent(5.625)},
                    J7:  {value: 740}, K7:  {value: _toPercent(4.875)}, L7:  {value: _toPercent(4.875)}, M7:  {value: _toPercent(4.999)}, N7:  {value: _toPercent(4.999)}, O7:  {value: _toPercent(4.999)}, P7:  {value: _toPercent(5.250)}, Q7:  {value: _toPercent(5.750)},
                    J8:  {value: 720}, K8:  {value: _toPercent(4.999)}, L8:  {value: _toPercent(4.999)}, M8:  {value: _toPercent(5.125)}, N8:  {value: _toPercent(5.125)}, O8:  {value: _toPercent(5.125)}, P8:  {value: _toPercent(5.500)}, Q8:  {value: _toPercent(5.875)},
                    J9:  {value: 700}, K9:  {value: _toPercent(4.999)}, L9:  {value: _toPercent(5.125)}, M9:  {value: _toPercent(5.125)}, N9:  {value: _toPercent(5.250)}, O9:  {value: _toPercent(5.375)}, P9:  {value: _toPercent(5.625)}, Q9:  {value: _toPercent(5.999)},
                    J10: {value: 680}, K10: {value: _toPercent(5.125)}, L10: {value: _toPercent(5.125)}, M10: {value: _toPercent(5.250)}, N10: {value: _toPercent(5.375)}, O10: {value: _toPercent(5.625)}, P10: {value: _toPercent(5.750)}, Q10: {value: _toPercent(6.250)},
                    J11: {value: 660}, K11: {value: _toPercent(5.500)}, L11: {value: _toPercent(5.625)}, M11: {value: _toPercent(5.750)}, N11: {value: _toPercent(5.875)}, O11: {value: _toPercent(5.999)}, P11: {value: _toPercent(6.375)}, Q11: {value: _toPercent(6.999)},
                    J12: {value: 640}, K12: {value: _toPercent(5.750)}, L12: {value: _toPercent(5.875)}, M12: {value: _toPercent(5.999)}, N12: {value: _toPercent(6.125)}, O12: {value: _toPercent(6.625)}, P12: {value: _toPercent(7.125)}, Q12: {value: _toPercent(7.875)},
                    /* beautify ignore:end */
                    K14: {//ABS_Score
                        formula: 'IF(C13<660,"NA",IF(AND(C13<680,C13>=660),660,IF(AND(C13<700,C13>=680),680,IF(AND(C13<700,C13>=680),680,IF(AND(C13<720,C13>=700),700,IF(AND(C13<740,C13>=720),720,IF(AND(C13<760,C13>=740),740,IF(C13>=760,760))))))))',
                    },
                    K15: {//ABS_LTV
                        formula: 'IF(C16<=0.5,0.5,IF(AND(C16<=0.55,C16>0.5),0.55,IF(AND(C16<=0.6,C16>0.55),0.6,IF(AND(C16<=0.65,C16>0.6),0.65,IF(AND(C16<=0.7,C16>0.65),0.7,IF(AND(C16<=0.75,C16>0.7),0.75,IF(AND(C16<=0.8,C16>0.75),0.8,IF(C16>0.75,"NA"))))))))',
                        format: '0.00%',
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
                    K19: {//FIVE_to_EIGHT_Units
                        formula: 'IF(C14="5-8",0.25%,0)',
                        format: '0.000%',
                    },
                    K20: {//IO
                        formula: 'IF(E19="Yes",0,0.25%)',
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
                onAfterCalculate: function () {
                    console.log('BEGIN: onAfterCalculate()');
                    // Fork this asynchronously b/c otherwise Calx.js-computed values would
                    // not be computed in time outside `submitHandler`. (NOTE: it is critical that
                    // `_checkForPassFail` be called this way in order to function correctly.)
                    setTimeout(function () {
                        // 1a) Check whether we pass DSCR or not (if not, get the
                        // error display ready, otherwise get success results ready).
                        console.log('BEGIN: onAfterCalculate()##setTimeout()');
                        _checkForPassFail();
                        console.log('END: onAfterCalculate()##setTimeout()');
                    }, 100);
                    console.log('END: onAfterCalculate()');
                },
            });//END: `$(...).calx()`

            // Configure debug display toggle button
            $('#debugValuesDisplayToggle').on('click', function () {
                _toggleDisplayDebugValues();
            });
            
            $('#emailMyResultsBtn').on('click', function () {
                var show = __toggleDisplayValuesElem('#emailMyResultsFormContainer');
                $('#emailMyResultsBtnContainer')[show ? 'hide' : 'show']();
            });

            $('#bypassDscrSponsorContainer').on('click', function () {
                // $('#sponsorLink').trigger('click');
                window.open('https://trussfinancialgroup.com/');
                return false;
            });

            $('#chooseAuthModal').modal({
                show: false,//Just init
                keyboard: false,//No escape!
            });
        });//END: jQuery `domready`
    }, false);//END: `deviceready`
})(jQuery, window);
