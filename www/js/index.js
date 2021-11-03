// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

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

        $('form#calxForm').bind('keypress', function (event) {
            if (event.keyCode === 13) {
                return false;
            }
        });

        // Initialize form validation on the registration form.
        // It has the name attribute "registration"
        $('form#calxForm').validate({
            // Specify validation rules
            rules: {
                // The key name on the left side is the name attribute
                // of an input field. Validation rules are defined
                // on the right side
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
                radioInterestOnlyDesired: {
                    required: true,
                },
                radioUseNoRatioInstead: {
                    required: true,
                },
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
                //form.submit(); // XXX TODO
            }
        }); //END: `$(...).validate(...)`

        $('form#calxForm').calx({
            data: {
                /* beautify ignore:start */
                //BEGIN: Pricing as of 6/11/21
                J5: '',   K5: .5,    L5: .55,    M5: .6,    N5: .65,    O5: .7,    P5: .75,    Q5: .8,
                J6: 760,  K6: 3.999,  L6: 4.125,  M6: 4.250,  N6: 4.250,  O6: 4.375,  P6: 4.500,  Q6: 4.625,
                J7: 740,  K7: 4.125,  L7: 4.250,  M7: 4.375,  N7: 4.375,  O7: 4.500,  P7: 4.625,  Q7: 4.750,
                J8: 720,  K8: 4.250,  L8: 4.375,  M8: 4.500,  N8: 4.500,  O8: 4.625,  P8: 4.750,  Q8: 4.999,
                J9: 700,  K9: 4.375,  L9: 4.500,  M9: 4.625,  N9: 4.750,  O9: 4.875,  P9: 4.999,  Q9: 5.250,
                J10: 680, K10: 4.500, L10: 4.625, M10: 4.750, N10: 4.875, O10: 5.125, P10: 5.250, Q10: 5.625,
                J11: 660, K11: 4.875, L11: 4.999, M11: 5.125, N11: 5.375, O11: 5.625, P11: 5.625, Q11: 6.250,
                J12: 640, K12: 5.250, L12: 5.375, M12: 5.500, N12: 5.750, O12: 5.999, P12: 6.250, Q12: 6.875,
                //END
                /* beautify ignore:end */
                K14: {//ABS_Score
                    formula: 'IF(C13<660,"NA",IF(AND(C13<680,C13>=660),660,IF(AND(C13<700,C13>=680),680,IF(AND(C13<700,C13>=680),680,IF(AND(C13<720,C13>=700),700,IF(AND(C13<740,C13>=720),720,IF(AND(C13<760,C13>=740),740,IF(C13>=760,760))))))))',
                },
                K15: {//ABS_LTV
                    formula: 'IF(C16<=0.5,0.5,IF(AND(C16<=0.55,C16>0.5),0.55,IF(AND(C16<=0.6,C16>0.55),0.6,IF(AND(C16<=0.65,C16>0.6),0.65,IF(AND(C16<=0.7,C16>0.65),0.7,IF(AND(C16<=0.75,C16>0.7),0.75,IF(AND(C16<=0.8,C16>0.75),0.8,IF(C16>0.75,"NA"))))))))',
                    format: '0%',
                },
                K17: {//Base_Rate  (A==>J, B==>K, ...)
                    // formula: 'INDEX(K6:Q12, MATCH(K14,J6:J12,-1), MATCH(K15,K5:Q5,1))',
                    //SUMPRODUCT(vlookup_column_range = vlookup_value) * (hlookup_row_range = hlookup_value) * data_array)
                    formula: 'SUMPRODUCT( (J6:J12=K14) * (K5:Q5=K15) * K6:Q12)',
                    // format: '0.000%',
                },
                K19: {//TWO_to_FOUR_Units
                    formula: 'IF(C14>=2,0.25%,0)',
                    format: '0.000%',
                },
                K20: {//IO
                    // formula: 'IF(E19="Yes",0.25%,0)',
                    formula: 'E19',
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
