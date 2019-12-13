import React from 'react';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Icon } from 'react-fa'
import { isIOS, isSafari } from "react-device-detect"
import klarnaIcon from "../images/Klarna-dark Copy.svg";
import { StripeProvider } from 'react-stripe-elements';
import { paymentTypes } from '../paymentMethods.json';
import { paymentMethods } from '../paymentMethods.json';

import {
    setSelectedPaymentMethod,
    setSelectedStripeMethod,
    setStripeCompleted,
    setCardNumberCompleted,
    setCardExpiryCompleted,
    setCardCvcCompleted,
    setFinished,
    setLoading,
    setLoadingPayStatus,
    setErrors,
    setSelectedSavedCard,
    setSelectedSavedCardFocus,
    setDeliveryAddressEdit
} from "../actions/userActions";
import {
    setSubscribeMethod,
    updateCustomerParaspar,
    updateCustomerApi,
    updateCustomerDelivery,
    setManualAddress
} from "../actions/customerActions";
import { setCardError } from "../actions/usersErrorsActions";
import { setAlertShow } from "../actions/alertsActions";
import * as customerErr from "../actions/customerErrorsActions";
import * as addressErr from "../actions/shippingAddressErrorsActions";
import * as billingErr from "../actions/billingAddressErrorsActions";
import { setStepperIndex, setStepFinished } from "../actions/stepperActions";
import { requestBraintreeToken, setInitialisedBraintree } from "../actions/paymentActions";
import Checkbox from 'material-ui/Checkbox';
import { Tabs, Tab } from 'material-ui/Tabs';
import StripeInput from '../payments/stripe/StripeInput';
import KlarnaForm from '../payments/stripe/types/KlarnaForm';
import Laybuy from "../payments/laybuy/Laybuy.Component";
import PaypalExpressCheckout from "../payments/paypal/PaypalExpressCheckout";
import blackcardIcon from "../images/black.svg";

import payByCardIcon from "../images/credit-card-icon.svg";
import paypalIcon2 from "../images/PayPal2.svg";
import googlepayicon from "../images/google-pay.svg";
import alipayicon from "../images/128px-AliPay_logo.svg.png";

import uncheckedIcon from "../images/checkbox_unchecked.svg";
import checkedIconBlue from "../images/checkbox_checked.svg";
import checkedIconBlack from "../images/checkbox_checked _black.svg";
import Toggle from 'material-ui/Toggle';
import laybuyMsg from "../images/laybuy_getitnow.png";

import { paymentIcons } from "../paymentIcons";

import {
    Elements
} from 'react-stripe-elements';


import { setGTM, updateOrderSub, updateOrderUnlockd, updateCartShipping } from "../actions/cartActions";
import { Link } from "react-router-dom";
import { globalUrls } from "../globals";
import * as collectActions from "../actions/collectActions";
import * as async from "async";
import {
    updateBasketShippings,
    updateCustomerInApi,
    updateOrderSubscription,
    validateWebsale
} from "../services";
import { setPaymentAuthCallError } from "../actions/usersErrorsActions";
import Raven from "raven-js";
import * as billingActions from "../actions/billingAddressActions";
import Alipay from '../payments/stripe/types/Alipay';
import Paybutton from "../payments/stripe/types/Paybutton";
import ApplePay from "../payments/stripe/types/ApplePay";
import { ReCaptcha } from '../recaptcha'
import { loadReCaptcha } from '../recaptcha'
import { setRecaptchaToken } from "../actions/userActions";

class PaymentSelection extends React.Component {

    constructor(props) {
        super(props);
        this.state = { setbutton: false };
    }

    componentDidMount() {
        loadReCaptcha(process.env.REACT_APP_RECAPTCHA_CLIENT_KEY);
    }

    verifyCallback = (recaptchaToken) => {
        // Here you will get the final recaptchaToken!!!
        this.props.setRecaptchaToken(recaptchaToken);
    }

    changePaymentMethod = (method) => {

        if (method == "stripe")
            this.props.setSelectedStripeMethod("card");

        if (method == "paypal" && this.shouldContinue()) {
            this.props.setSelectedPaymentMethod(method);
        }
        else if (method === "laybuy" && this.shouldContinue()) {
            this.props.setSelectedPaymentMethod(method);
        }
        else if (method != "paypal") {
            this.props.setSelectedPaymentMethod(method);
        }

    }

    handleActive = (tab) => {

        if (this.props.restrictedProduct && (this.props.addressRestricted || this.props.quantityRestricted )){
            return false;
        }

        let selectedPayment = '';
        this.props.setGTM({
            products: this.props.cart.products,
            step: 2,
            currencyName: this.props.cart.currencyName
        });

        this.props.updateCustomerDelivery({
            cartId: this.props.cart.basketId,
            customer: this.props.customer,
            address: this.props.address,
            channelId: this.props.cart.channelId,
            currencyName: this.props.cart.currencyName
        });

        let mainPaymentMethod = "";
        let stripPaymentMethod = "";

        switch (tab) {
            case "paypal":
                mainPaymentMethod = "paypal";
                stripPaymentMethod = "";
                break;
            case "laybuy":
                mainPaymentMethod = "laybuy";
                stripPaymentMethod = "";
                break;
            default:
                mainPaymentMethod = "stripe";
                stripPaymentMethod = tab;
        }

        if (tab === "return") {
            this.props.setSelectedPaymentMethod("");
            this.props.setSelectedStripeMethod("");
            selectedPayment = '';
        }
        else if (tab === "paypal" && (this.shouldContinue(mainPaymentMethod, stripPaymentMethod))) {
            this.props.setLoading(true);
            this.props.setLoadingPayStatus(true);

            //proceed only if the async calls go through successfully
            async.series([
                    (callback) => {
                        if (!this.props.users.authenticated) {
                            let response = updateOrderSubscription({
                                basketId: this.props.cart.basketId,
                                subscribeMethods: this.props.customer.subscribeMethods
                            });

                            response.then(r => {
                                if (r.status.toLowerCase() === "success") {
                                    callback(null, r)
                                } else {
                                    callback(r, null)
                                }
                            })

                        } else {
                            callback(null, "authenticated");
                        }
                    },
                    (callback) => {
                        /*
                        cart shipping
                         */
                        let value = this.props.addressBilling.method;
                        let selectedShipping;
                        let shippingOptions = this.props.cart.shippingOptions;
                        for (let i = 0; i < shippingOptions.length; i++) {
                            if (shippingOptions[i].id == value) {
                                selectedShipping = shippingOptions[i]
                            }
                        }

                        let response = updateBasketShippings({
                            cartId: this.props.cart.basketId,
                            shippingTotal: this.props.cart.shipment,
                            shippingCarrier: selectedShipping
                        });

                        response.then(r => {
                            if (r.status.toLowerCase() === "success") {
                                callback(null, r)
                            } else {
                                callback(r, null)
                            }
                        })

                    },
                    (callback) => {
                        let response = updateCustomerInApi({
                            cartId: this.props.cart.basketId,
                            customer: this.props.customer,
                            address: this.props.address,
                            billing: this.props.addressBilling,
                            authState: this.props.users.authState
                        });
                        response.then(r => {
                            if (r.status.toLowerCase() === "success") {
                                callback(null, r)
                            } else {
                                callback(r, null)
                            }
                        })
                    },
                    (callback) => {
                        let response = validateWebsale(this.props.users.data.basket_id, this.props.users.recaptchaToken);
                        response.then(r => {
                            if (r.status.toLowerCase() === "success") {
                                callback(null, r)
                            } else {
                                callback(r, null)
                            }
                        })
                    }
                ],
                (err, results) => {
                    if (err) {
                        this.props.setFinished(false);
                        Raven.captureMessage(err.messages);
                        this.props.setPaymentAuthCallError(err.messages);
                        this.props.setLoading(false);
                        this.props.setLoadingPayStatus(false);
                    } else {
                        this.props.setLoading(false);
                        this.props.setLoadingPayStatus(false);
                        this.props.setSelectedPaymentMethod(tab);
                        this.props.setSelectedStripeMethod("");
                        selectedPayment = tab;
                    }
                });
        }
        else if (tab === "laybuy" && (this.shouldContinue(mainPaymentMethod, stripPaymentMethod))) {
            this.props.setSelectedPaymentMethod(tab);
            this.props.setSelectedStripeMethod("");
            selectedPayment = tab;
        }
        else if (tab !== "paypal" && tab !== "laybuy") {

            if (tab === "card") {
                this.props.setStripeCompleted(false);
            }
            else if (tab === "alipay" && (this.shouldContinue())) {
                this.props.setStripeCompleted(true);
            }
            else if (tab === "google_pay" && (this.shouldContinue('google_pay', ''))) {
                this.props.setStripeCompleted(true);
                //proceed only if the async calls go through successfully
            }
            else if (tab === "ideal") {
                if (this.props.users.idealBank)
                    this.props.setStripeCompleted(true);
                else
                    this.props.setStripeCompleted(false);
            }
            else if (tab === "sepa_debit") {
                this.props.setStripeCompleted(this.props.users.sepaStatus);
            }
            else
                this.props.setStripeCompleted(true);

            this.props.setSelectedPaymentMethod("stripe");
            this.props.setSelectedStripeMethod(tab);
            selectedPayment = 'stripe';
        }

        if (selectedPayment && window._paq) {
            window._paq.push(['trackEvent', 'Entering payment', 'method', selectedPayment]);
        }

    }


    handleNext = () => {

        const stepIndex = this.props.ui.stepperReducer.stepIndex;
        if (this.shouldContinue(this.props.users.selectedPaymentMethod, this.props.users.selectedStripeMethod)) {

            if (stepIndex >= 2) {
                if (this.props.users.authenticated)
                    this.props.updateCustomerParaspar(this.props.customer, this.props.address, this.props.addressBilling, this.props.cart.channelId, this.props.cart.currencyName);
                else {
                    let subscribeMethods = this.props.customer.subscribeMethods;
                    let sms_optout = 'yes', postalpermit = 'no', emailpermit = 'no';
                    subscribeMethods.forEach((item) => {
                        if (item == 'sms_subs') {
                            sms_optout = 'no';
                        }
                        if (item == 'post_subs') {
                            postalpermit = 'yes';
                        }
                        if (item == 'email_subs') {
                            emailpermit = 'yes';
                        }
                    });
                    let report = document.getElementById('reporting-img');
                    let report_src = globalUrls.reporting_image + "?nourl=registration-confirm-checkout&rg_confirm=checkout&title=" + this.props.customer.title
                        + "&firstname=" + this.props.customer.firstName
                        + "&lastname=" + this.props.customer.lastName
                        + "&email=" + this.props.customer.email
                        + "&mobile=" + this.props.customer.phone
                        + "&postcode=" + this.props.address.postCode
                        + "&address1=" + this.props.address.address
                        + "&address2=" + (this.props.address.optionalAddress ? this.props.address.optionalAddress : ' ')
                        + "&address3=" + this.props.address.city
                        + "&location=" + this.props.address.country
                        + "&sms_optout=" + sms_optout
                        + "&postalpermit=" + postalpermit
                        + "&emailpermit=" + emailpermit
                        + "&custrefid=" + this.props.customer.customerId;
                    report.setAttribute('src', encodeURI(report_src));

                    if (emailpermit) {
                        let newsletter_reporting_image = document.createElement('img');
                        newsletter_reporting_image.id = 'reporting-img-newsletter';
                        newsletter_reporting_image.src = encodeURI(globalUrls.reporting_image + '?nourl=registration-confirm-notify&newsletter=registration&notify=regsignup&email=' + this.props.customer.email + '&emailpermit=' + emailpermit);
                        report.parentNode.insertBefore(newsletter_reporting_image, report.nextSibling);
                    }

                }

                let value = this.props.addressBilling.method;

                //TODO: THROW ERROR IF SHIPPING NOT SELECTED!
                if (this.props.cart.shippingOptions && this.props.cart.shippingOptions !== undefined && this.props.cart.shippingOptions.length > 0) {
                    for (let i = 0; i < this.props.cart.shippingOptions.length; i++) {
                        if (this.props.cart.shippingOptions[i].id === value) {

                            let converted_rate;
                            let eur_conv = 0;
                            let usd_conv = 0;
                            let jyp_conv = 0;
                            let aud_conv = 0;
                            let hkd_conv = 0;
                            let cny_conv = 0;

                            this.props.cart.currencies && this.props.cart.currencies.map((option, index) => {

                                if (option.code === "EUR")
                                    eur_conv = Number(option.rate);
                                else if (option.code === "USD")
                                    usd_conv = Number(option.rate);
                                else if (option.code === "JPY")
                                    jyp_conv = Number(option.rate);
                                else if (option.code === "AUD")
                                    aud_conv = Number(option.rate);
                                else if (option.code === "HKD")
                                    hkd_conv = Number(option.rate);
                                else if (option.code === "CNY")
                                    cny_conv = Number(option.rate);

                            });

                            let fixedPrice = 0;
                            let valuePriceStatus = 0;
                            let percentagePriceStatus = 0;
                            let priceValue = 0;

                            let parsedPrice = 0;

                            //NOTE - find discount shipping method, if any
                            this.props.cart.deliveryDiscounts && this.props.cart.deliveryDiscounts.map((discount, index) => {
                                let fetchMethod = discount.delivery_methods_id.split("#");
                                if (fetchMethod[1] === this.props.cart.shippingOptions[i].code) {
                                    if (discount.discount_type === "FIXED") {
                                        converted_rate = Number(discount.discount_value).toFixed(2);
                                        fixedPrice = 1;
                                    }
                                    else if (discount.discount_type === "VALUE") {
                                        valuePriceStatus = 1;
                                        priceValue = Number(discount.discount_value);
                                    }
                                    else if (discount.discount_type === "PERCENTAGE") {
                                        percentagePriceStatus = 1;
                                        priceValue = Number(discount.discount_value);
                                    }
                                }
                            });


                            if (fixedPrice === 0) {
                                if (this.props.cart.currencyName === "GBP") {
                                    converted_rate = Number(this.props.cart.shippingOptions[i].rate);
                                    //value discount
                                    if (valuePriceStatus === 1)
                                        converted_rate -= priceValue;
                                }
                                else if (this.props.cart.currencyName === "EUR") {

                                    if (this.props.cart.shippingOptions[i].eur_rate) {
                                        converted_rate = Number(this.props.cart.shippingOptions[i].eur_rate);
                                        //value discount
                                        if (valuePriceStatus === 1)
                                            converted_rate -= priceValue;
                                    }
                                    else {
                                        //value discount
                                        if (valuePriceStatus === 1)
                                            parsedPrice = Number(this.props.cart.shippingOptions[i].rate) - priceValue;
                                        else
                                            parsedPrice = Number(this.props.cart.shippingOptions[i].rate);

                                        converted_rate = parsedPrice * eur_conv;

                                    }
                                }
                                else if (this.props.cart.currencyName === "USD") {
                                    if (this.props.cart.shippingOptions[i].usd_rate) {
                                        converted_rate = Number(this.props.cart.shippingOptions[i].usd_rate);
                                        //value discount
                                        if (valuePriceStatus === 1)
                                            converted_rate -= priceValue;
                                    }
                                    else {
                                        //value discount
                                        if (valuePriceStatus === 1)
                                            parsedPrice = Number(this.props.cart.shippingOptions[i].rate) - priceValue;
                                        else
                                            parsedPrice = Number(this.props.cart.shippingOptions[i].rate);

                                        converted_rate = parsedPrice * usd_conv;
                                    }
                                }
                                else if (this.props.cart.currencyName === "AUD") {
                                    //value discount
                                    if (valuePriceStatus === 1)
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate) - priceValue;
                                    else
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate);

                                    converted_rate = parsedPrice * aud_conv;
                                }
                                else if (this.props.cart.currencyName === "JPY") {
                                    //value discount
                                    if (valuePriceStatus === 1)
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate) - priceValue;
                                    else
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate);

                                    converted_rate = parsedPrice * jyp_conv;
                                }
                                else if (this.props.cart.currencyName === "HKD") {
                                    //value discount
                                    if (valuePriceStatus === 1)
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate) - priceValue;
                                    else
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate);

                                    converted_rate = parsedPrice * hkd_conv;
                                }
                                else if (this.props.cart.currencyName === "CNY") {
                                    //value discount
                                    if (valuePriceStatus === 1)
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate) - priceValue;
                                    else
                                        parsedPrice = Number(this.props.cart.shippingOptions[i].rate);

                                    converted_rate = parsedPrice * cny_conv;
                                }
                            }

                            if (percentagePriceStatus === 1) {
                                converted_rate = (Number(this.props.cart.shippingOptions[i].rate) - Number(this.props.cart.shippingOptions[i].rate) * (priceValue / 100)).toFixed(2);
                            }

                            converted_rate = Number(converted_rate);


                            //also update the cart shipping method total

                            break;
                        }
                    }
                }

                this.props.setStepFinished(false);

                async.series([
                        (callback) => {
                            if (!this.props.users.authenticated) {
                                let response = updateOrderSubscription({
                                    basketId: this.props.cart.basketId,
                                    subscribeMethods: this.props.customer.subscribeMethods
                                });

                                response.then(r => {
                                    if (r.status.toLowerCase() === "success") {
                                        callback(null, r)
                                    } else {
                                        callback(r, null)
                                    }
                                })

                            } else {
                                callback(null, "authenticated");
                            }
                        },
                        (callback) => {
                            /*
                            cart shipping
                             */
                            let value = this.props.addressBilling.method;
                            let selectedShipping;
                            let shippingOptions = this.props.cart.shippingOptions;
                            for (let i = 0; i < shippingOptions.length; i++) {
                                if (shippingOptions[i].id == value) {
                                    selectedShipping = shippingOptions[i]
                                }
                            }

                            let response = updateBasketShippings({
                                cartId: this.props.cart.basketId,
                                shippingTotal: this.props.cart.shipment,
                                shippingCarrier: selectedShipping
                            });

                            response.then(r => {
                                if (r.status.toLowerCase() === "success") {
                                    callback(null, r)
                                } else {
                                    callback(r, null)
                                }
                            })

                        },
                        (callback) => {
                            let response = updateCustomerInApi({
                                cartId: this.props.cart.basketId,
                                customer: this.props.customer,
                                address: this.props.address,
                                billing: this.props.addressBilling,
                                authState: this.props.users.authState
                            });
                            response.then(r => {
                                if (r.status.toLowerCase() === "success") {
                                    callback(null, r)
                                } else {
                                    callback(r, null)
                                }
                            })
                        },
                        (callback) => {
                            let response = validateWebsale(this.props.users.data.basket_id, this.props.users.recaptchaToken);
                            response.then(r => {
                                if (r.status.toLowerCase() === "success") {
                                    callback(null, r)
                                } else {
                                    callback(r, null)
                                }
                            })
                        }
                    ],
                    (err, results) => {
                        if (err) {
                            this.props.setFinished(false);
                            Raven.captureMessage(err.messages);
                            if (this.props.users.selectedPaymentMethod !== "laybuy") {
                                this.props.setPaymentAuthCallError(err.messages);
                            }
                            this.props.setLoading(false);
                            this.props.setLoadingPayStatus(false);
                        } else {
                            if (this.props.users.selectedPaymentMethod !== "laybuy") {
                                this.props.setFinished(true);
                            }
                        }
                    });
            }
            else
                this.props.setStepFinished(false);

        }

    };


    subscribeMethod = (e) => {
        let checkboxName = e.target.name;
        let subscribeMethods = [];

        if (this.props.customer.subscribeMethods && Array.isArray(this.props.customer.subscribeMethods)) {
            subscribeMethods = this.props.customer.subscribeMethods;
        }

        if (subscribeMethods.includes(checkboxName)) {
            //remove the selected element

            //also remove all sub methods if selected
            if (subscribeMethods.includes("all_subs")) {
                var indexAll = subscribeMethods.indexOf("all_subs");
                if (indexAll > -1) {
                    subscribeMethods.splice(indexAll, 1);
                    this.props.setSubscribeMethod(subscribeMethods);
                }
            }

            var index = subscribeMethods.indexOf(checkboxName);
            if (index > -1) {
                subscribeMethods.splice(index, 1);
                this.props.setSubscribeMethod(subscribeMethods);
            }
        }
        else {
            //add the selected element

            //check for all methods
            if (checkboxName == "all_subs")
                subscribeMethods = ["email_subs", "sms_subs", "post_subs", "all_subs"];
            else
                subscribeMethods.push(checkboxName);

            this.props.setSubscribeMethod(subscribeMethods);
        }


    }

    openAddressEdit() {
        if (this.props.users.authenticated) {
            this.props.setDeliveryAddressEdit(true);
        }
        if (!this.props.customer.manualAddress) {
            this.props.setManualAddress(true);
        }
    }

    shouldContinue(mainPaymentMethod, stripPaymentMethod) {
        // will check if user can continue,
        // not letting the user get to next step without completing all inputs
        let errors = [];

        if (this.props.customer.deliveryType === 'collect') {
            if (this.props.customer.email === null || this.props.customer.email.length === 0) {
                errors.push({
                    type: "email",
                    text: "Email is required!",
                    section: 'collectLogin'
                });
            } else {
                if (!this.validateEmail(this.props.customer.email)) {
                    errors.push({
                        type: "email",
                        text: "Oops, your email was entered incorrectly.Try again.",
                        section: 'collectLogin'
                    })
                }
                this.props.setEmailError(null);
            }


            if (this.props.customer.firstName === null || this.props.customer.firstName.trim().length === 0) {
                errors.push({
                    type: "firstName",
                    text: "First Name is required!",
                    section: 'collectCustomer'
                });
            } else {
                if (!this.hasNumberOrSpecial(this.props.customer.firstName)) {
                    errors.push({
                        type: "firstName",
                        text: "Please enter only letters!",
                        section: 'collectCustomer'
                    });
                } else {
                    this.props.setFirstNameError(null);
                }
            }
            if (this.props.customer.lastName === null || this.props.customer.lastName.trim().length === 0) {
                errors.push({
                    type: "lastName",
                    text: "Last Name is required!",
                    section: 'collectCustomer'
                });
            } else {
                if (!this.hasNumberOrSpecial(this.props.customer.lastName)) {
                    errors.push({
                        type: "lastName",
                        text: "Please enter only letters!",
                        section: 'collectCustomer'
                    });
                } else {
                    this.props.setLastNameError(null);
                }
            }

            if (this.props.customer.phone == null || this.props.customer.phone.trim().length === 0) {
                errors.push({
                    type: "phone",
                    text: "Phone is required!",
                    section: 'collectCustomer'
                });
            } else {
                if (!this.isPhoneNumber(this.props.customer.phone)) {
                    errors.push({
                        type: "phone",
                        text: "Please enter only digits!",
                        section: 'collectCustomer'
                    });
                } else {
                    this.props.setPhoneError(null);
                }
            }

            if (this.props.customer.title == null || this.props.customer.title.trim().length === 0) {
                errors.push({
                    type: "title",
                    text: "Title is required",
                    section: 'collectCustomer'
                });
            }
            else {
                this.props.setTitleError(null);
            }

            if (this.props.addressBilling.addressBilling == null || this.props.addressBilling.addressBilling.trim().length === 0) {
                errors.push({
                    type: "billingAddress",
                    text: "Address is required",
                    section: 'collectBilling'
                })
            } else {
                this.props.setBillingAddressError(null);
            }
            if (this.props.addressBilling.cityBilling == null || this.props.addressBilling.cityBilling.trim().length === 0) {
                errors.push({
                    type: "billingCity",
                    text: "City is required",
                    section: 'collectBilling'
                })
            } else {
                this.props.setBillingCityError(null);
            }
            if (this.props.addressBilling.postCodeBilling === null || this.props.addressBilling.postCodeBilling.trim().length === 0) {
                errors.push({
                    type: "postCodeBilling",
                    text: "PostCode is required",
                    section: 'collectBilling'
                })
            } else {
                this.props.setPostCodeBillingError(null);
            }
            if (this.props.addressBilling.countryBilling === null || this.props.addressBilling.countryBilling.trim().length === 0) {
                errors.push({
                    type: "billingCountry",
                    text: "Country is required",
                    section: 'collectBilling'
                })
            } else {
                this.props.setBillingCountryError(null);
            }
        } else {
            if (this.props.customer.email === null || this.props.customer.email.trim().length === 0) {
                errors.push({
                    type: "email",
                    text: "Email is required!",
                    section: 'deliveryLogin'
                });
            } else {
                if (!this.validateEmail(this.props.customer.email)) {
                    errors.push({
                        type: "email",
                        text: "Oops, your email was entered incorrectly.Try again.",
                        section: 'deliveryLogin'
                    })
                }
                this.props.setEmailError(null);
            }
            if (this.props.customer.firstName === null || this.props.customer.firstName.length === 0) {
                errors.push({
                    type: "firstName",
                    text: "First Name is required!",
                    section: 'deliveryCustomer'
                });
            } else {
                if (!this.hasNumberOrSpecial(this.props.customer.firstName)) {
                    errors.push({
                        type: "firstName",
                        text: "Please enter only letters!",
                        section: 'deliveryCustomer'
                    });
                } else {
                    this.props.setFirstNameError(null);
                }
            }
            if (this.props.customer.lastName === null || this.props.customer.lastName.trim().length === 0) {
                errors.push({
                    type: "lastName",
                    text: "Last Name is required!",
                    section: 'deliveryCustomer'
                });
            } else {
                if (!this.hasNumberOrSpecial(this.props.customer.lastName)) {
                    errors.push({
                        type: "lastName",
                        text: "Please enter only letters!",
                        section: 'deliveryCustomer'
                    });
                } else {
                    this.props.setLastNameError(null);
                }
            }
            if (this.props.customer.phone === null || this.props.customer.phone.trim().length === 0) {
                errors.push({
                    type: "phone",
                    text: "Phone is required!",
                    section: 'deliveryCustomer'
                });
            }
            else {
                if (!this.isPhoneNumber(this.props.customer.phone)) {
                    errors.push({
                        type: "phone",
                        text: "Please enter only digits!",
                        section: 'deliveryCustomer'
                    });
                } else {
                    this.props.setPhoneError(null);
                }
            }

            if (this.props.address.address === null || this.props.address.address.trim().length === 0) {
                errors.push({
                    type: "address",
                    text: "Address is required",
                    section: 'deliveryShipping'
                })
            } else {
                this.props.setAddressError(null);
            }
            if (this.props.address.city === null || this.props.address.city.trim().length === 0) {
                errors.push({
                    type: "city",
                    text: "City is required",
                    section: 'deliveryShipping'
                })
            } else {
                this.props.setCityError(null);
            }
            if (!this.props.address.postCode) {
                errors.push({
                    type: "postcode",
                    text: "PostCode is required",
                    section: 'deliveryShipping'
                })
            } else {
                this.props.setPostCodeError(null);
            }

            if (!this.props.address.country) {
                errors.push({
                    type: "country",
                    text: "Country is required",
                    section: 'deliveryShipping'
                })
            } else {
                this.props.setCountryError(null);
            }
            if (this.props.addressBilling.method === null) {
                if (!this.props.address.postCode) {
                    errors.push({
                        type: "shippingMethod",
                        text: "To list the available Shipping Methods a Shipping Postcode must be supplied!"
                    })
                } else {
                    errors.push({
                        type: "shippingMethod",
                        text: "Please check a shipping method!",
                        section: 'shippingMethod'
                    })
                }
            } else {
                this.props.setShippingMethodError(null)

            }


            //checking if shipping is true
            if (this.props.addressBilling.title == null || this.props.addressBilling.title.trim().length === 0) {
                errors.push({
                    type: "billingTitle",
                    text: "Title is required",
                    section: 'deliveryBilling'
                });
            }
            else {
                this.props.setTitleBillingError(null);
            }

            if (this.props.addressBilling.firstNameBilling == null || this.props.addressBilling.firstNameBilling.trim().length === 0) {
                errors.push({
                    type: "billingFirstName",
                    text: "First Name is required",
                    section: 'deliveryBilling'
                });
            } else {
                if (!this.hasNumberOrSpecial(this.props.addressBilling.firstNameBilling)) {
                    errors.push({
                        type: "billingFirstName",
                        text: "Please enter only letters!",
                        section: 'deliveryBilling'
                    });
                } else {
                    this.props.setBillingFirstNameError(null);
                }
            }
            if (this.props.addressBilling.lastNameBilling == null || this.props.addressBilling.lastNameBilling.trim().length === 0) {
                errors.push({
                    type: "billingLastName",
                    text: "Last Name is required",
                    section: 'deliveryBilling'
                })
            } else {
                if (!this.hasNumberOrSpecial(this.props.addressBilling.lastNameBilling)) {
                    errors.push({
                        type: "billingLastName",
                        text: "Please enter only letters!",
                        section: 'deliveryBilling'
                    });
                } else {
                    this.props.setBillingLastNameError(null);
                }
            }

            if (this.props.addressBilling.addressBilling == null || this.props.addressBilling.addressBilling.trim().length === 0) {
                errors.push({
                    type: "billingAddress",
                    text: "Address is required",
                    section: 'deliveryBilling'
                })
            } else {
                this.props.setBillingAddressError(null);
            }
            if (this.props.addressBilling.cityBilling == null || this.props.addressBilling.cityBilling.trim().length === 0) {
                errors.push({
                    type: "billingCity",
                    text: "City is required",
                    section: 'deliveryBilling'
                })
            } else {
                this.props.setBillingCityError(null);
            }

            if (this.props.addressBilling.postCodeBilling === null || this.props.addressBilling.postCodeBilling.trim().length === 0) {
                errors.push({
                    type: "postCodeBilling",
                    text: "PostCode is required",
                    section: 'deliveryBilling'
                })
            } else {
                this.props.setPostCodeBillingError(null);
            }
            if (this.props.addressBilling.countryBilling === null || this.props.addressBilling.countryBilling.trim().length === 0) {
                errors.push({
                    type: "billingCountry",
                    text: "Country is required",
                    section: 'deliveryBilling'
                })
            } else {
                this.props.setBillingCountryError(null);
            }

        }


        if (errors.length > 0) {
            this.props.setErrors(true);
            this.props.setAlertShow(true);
            this.setState({ setbutton: false });
            setTimeout(() => {
                this.props.setAlertShow(false);
            }, 2000);

            let collect = false;
            if (this.props.customer.deliveryType === 'collect') {
                collect = true;
                if (errors[0].section == 'collectLogin') {
                    document.getElementById('loginSection') && document.getElementById('loginSection').scrollIntoView();
                }
                else if (errors[0].section == 'collectCustomer') {
                    document.getElementById('billingSection') && document.getElementById('billingSection').scrollIntoView();
                }
                else if (errors[0].section == 'collectBilling') {
                    document.getElementById('billingSection') && document.getElementById('billingSection').scrollIntoView();
                }
            }
            else {
                if (errors[0].section == 'deliveryLogin') {
                    document.getElementById('loginSection') && document.getElementById('loginSection').scrollIntoView();
                }
                else if (errors[0].section == 'deliveryCustomer') {
                    document.getElementById('shippingAddress') && document.getElementById('shippingAddress').scrollIntoView();
                }
                else if (errors[0].section == 'deliveryShipping') {
                    let shippingSection = document.querySelector('.shipp-address');
                    shippingSection && shippingSection.scrollIntoView();
                }
                else if (errors[0].section == 'deliveryBilling') {
                    document.getElementById('billingSection') && document.getElementById('billingSection').scrollIntoView();
                }
                else if (errors[0].section == 'shippingMethod') {
                    document.getElementById('shippingMethod') && document.getElementById('shippingMethod').scrollIntoView();
                }
            }

            let billingErrors = false;
            let deliveryErrors = false;
            errors.forEach((error) => {
                // shipping errors
                if (error.type == "firstName") {
                    this.props.setFirstNameError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "lastName") {
                    this.props.setLastNameError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "title") {
                    this.props.setTitleError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "email") {
                    this.props.setEmailError(error.text);
                }
                if (error.type == "phone") {
                    this.props.setPhoneError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "company") {
                    this.props.setCompanyError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "address") {
                    this.props.setAddressError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "city") {
                    this.props.setCityError(error.text);
                    deliveryErrors = true;
                }
                if (error.type == "country") {
                    this.props.setCountryError(error.text);
                    deliveryErrors = true;
                }

                if (error.type == "postcode") {
                    this.props.setPostCodeError(error.text);
                    deliveryErrors = true;
                }

                //    billing errors
                if (error.type == "billingTitle") {
                    this.props.setTitleBillingError(error.text);
                    billingErrors = true;
                }
                if (error.type == "billingFirstName") {
                    this.props.setBillingFirstNameError(error.text);
                    billingErrors = true;
                }
                if (error.type == "billingLastName") {
                    this.props.setBillingLastNameError(error.text);
                    billingErrors = true;
                }
                if (error.type == "billingCompany") {
                    this.props.setBillingCompanyError(error.text);
                    billingErrors = true;
                }
                if (error.type == "billingAddress") {
                    this.props.setBillingAddressError(error.text);
                    billingErrors = true;
                    if (collect)
                        this.props.setCollectManual(true);
                    else
                        this.props.setManualBillingAddress(true);
                }
                if (error.type == "billingCity") {
                    this.props.setBillingCityError(error.text);
                    billingErrors = true;
                    if (collect)
                        this.props.setCollectManual(true);
                    else
                        this.props.setManualBillingAddress(true);
                }
                if (error.type == "billingCountry") {
                    this.props.setBillingCountryError(error.text);
                    billingErrors = true;
                    if (collect)
                        this.props.setCollectManual(true);
                    else
                        this.props.setManualBillingAddress(true);
                }

                if (error.type == "shippingMethod") {
                    this.props.setShippingMethodError(error.text);
                }

                if (error.type == "postCodeBilling") {
                    this.props.setPostCodeBillingError(error.text);
                    billingErrors = true;
                    if (collect)
                        this.props.setCollectManual(true);
                    else
                        this.props.setManualBillingAddress(true);
                }

            });
            //show the billing address form if there are billing errors
            if (billingErrors) {
                this.props.setShipping(false);
            }
            if (deliveryErrors) {
                this.openAddressEdit();
            }
            return false;
        }
        else {
            this.setState({ setbutton: true });
            if (mainPaymentMethod == "stripe") {
                if (stripPaymentMethod == "card") {
                    if (this.props.users.cardNumberCompleted && this.props.users.cardExpiryCompleted && this.props.users.cardCvcCompleted) {
                        this.props.setLoading(true);
                        return true;
                    }
                    else {
                        this.props.setCardError("Please complete card information!");
                        return false
                    }
                }
                else {
                    this.props.setLoading(true);
                    return true;
                }
            }
            else {
                this.props.setErrors(false);
                this.props.setAlertShow(false);
                return true;
            }

        }

    }


    validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    hasNumberOrSpecial(myString) {
        return /^[a-zA-Z- ]*$/.test(myString);
    }


    isPhoneNumber(string) {
        return /^[+]?[\s0-9]*$/.test(string);
    }

    toggleSelectedCard = (card) => {
        this.props.setSelectedSavedCard(card);
        this.props.setSelectedSavedCardFocus(true);
    }

    editSavedCard = (card) => {
        console.log(card);
    }

    fetchQueryParam = (name, url) => {

        if (!url)
            url = window.location.href;

        name = name.replace(/[\[\]]/g, "\\$&");

        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);

        if (!results)
            return null;

        if (!results[2])
            return '';

        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    render() {
        let paymentIconClass = "paymentTypeIcon col-sm-3 col-xs-3";
        if (this.props.quantityRestricted || this.props.addressRestricted) {
            paymentIconClass += " grayscale";
        }
        // let paymentIconClass = (this.props.quantityRestricted || this.props.addressRestricted) ? "paymentTypeIcon col-sm-3 col-xs-3 grayscale" : "paymentTypeIcon col-sm-3 col-xs-3 ";
        // console.log("paymentIconClass")

        let subscribeMethods = [];

        if (this.props.customer.subscribeMethods && Array.isArray(this.props.customer.subscribeMethods)) {
            subscribeMethods = this.props.customer.subscribeMethods;
        }

        let country = this.props.address.shortCountry;


        if (!this.props.address.shortCountry) {
            country = "GB";
        }
        let currencyName = this.props.cart.currencyName
        let countryName= this.props.address.shortCountry

        paymentTypes.forEach(function (paymentType) {
            paymentMethods[paymentType].status = false;
            let paymentMethodName = paymentMethods[paymentType].name.trim().toLowerCase()
            if (paymentMethods[paymentType].countries.includes(country)){
                paymentMethods[paymentType].status = true;
            }
            // paymentMethodName (use it for other paymentMethodNames also)
            console.log(paymentMethods[paymentType].currencies)
            if ((paymentMethodName === 'google_pay' || paymentMethodName === 'alipay') && !paymentMethods[paymentType].currencies.includes(currencyName) && (!paymentMethods[paymentType].status)) {
                paymentMethods[paymentType].status = false;
            }

            if (paymentMethods[paymentType].name === 'Klarna' && !paymentMethods[paymentType].currencies.includes(currencyName)) {
                paymentMethods[paymentType].status = false;
            }

            if (paymentMethodName === 'alipay' && !paymentMethods[paymentType].status) {
                paymentMethods[paymentType].hash.forEach((value)=> {
                    if (value.country == countryName && value.currency == currencyName){
                        return paymentMethods[paymentType].status = true;
                    }
                })
            }
        });

        var settings = {
            dots: false,
            arrows: false,
            infinite: true,
            swipeToSlide: true,
            speed: 500,
            slidesToShow: 2,
            slidesToScroll: 1,
            variableWidth: true,
            responsive: [
                {
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 1,
                        variableWidth: true
                    }
                }
            ]

        };

        let cardElements;

        if (this.props.users.savedCards) {
            let savedCards = this.props.users.savedCards;
            cardElements = Object.keys(savedCards).length > 0 && Object.keys(savedCards).map(function (card, i) {

                let cardNumber = savedCards[card].number;
                let last4digits = cardNumber.slice(-4);
                let cutCardNumber = cardNumber.slice(0, -4);


                let replacedXNumber = "";
                for (var i = 1; i <= cutCardNumber.length; i++) {
                    if (i % 4 == 0) {
                        replacedXNumber += "x ";
                    }
                    else {
                        replacedXNumber += "x";
                    }
                }


                return (
                    <div key={i}>
                        <div className="card-mockup">
                            <div
                                className={this.props.users.selectedSavedCard == card ? "" : "card-mockup-overlay"}></div>
                            <h3 className="card-owner">{savedCards[card].owner}</h3>
                            <p className="card-code"><span>{replacedXNumber}</span><span>{last4digits}</span></p>
                            <p className="expiring">Expires end</p>
                            <p className="expiring-date">{savedCards[card].expiry}</p>
                            <img src={paymentIcons[savedCards[card].type]} />
                            <div className="row">
                                <div style={{ marginTop: "15px" }} className="col-md-12">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <Toggle
                                                labelStyle={{ fontFamily: "Montserrat", fontSize: "14px" }}
                                                label="Selected"
                                                labelPosition="right"
                                                style={{ minWidth: "auto", width: "auto" }}
                                                thumbSwitchedStyle={{ backgroundColor: "#fff" }}
                                                trackSwitchedStyle={{ backgroundColor: "#51d958" }}
                                                toggled={card == this.props.users.selectedSavedCard}
                                                onToggle={this.toggleSelectedCard.bind(this, card)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            {card == this.props.users.selectedSavedCard && <a className="card-edit"
                                                                                              onClick={this.editSavedCard.bind(this, card)}>Edit</a>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }, this);
        }

        //check for query params and form the url
        let client_secret = this.fetchQueryParam('client_secret');
        let livemode = this.fetchQueryParam('livemode');
        let source = this.fetchQueryParam('source');
        let laybuyAmountLimit = 720;


        let extra_url = "";

        if (client_secret && livemode && source) {
            extra_url = `&client_secret=${client_secret}&livemode=${livemode}&source=${source}`
        }
        let fascia_id = this.props.users.data && this.props.users.data.fascia_id;
        let checkedIcon = checkedIconBlue;
        if (fascia_id && fascia_id === 5)
            checkedIcon = checkedIconBlack;

        return (

            <div>
                {

                    this.props.cart.subtotal > 0 &&
                    <div id="paymentSection">
                        {(this.props.cart.currencyName === "GBP" && this.props.address.shortCountry === "GB" && this.props.cart.total < laybuyAmountLimit &&
                            <div id="laybuy">
                                <img src={laybuyMsg} className="laybuyImgMsg" />
                            </div>
                        )}
                        <h3 style={{fontSize: "18px", color: "black", marginTop: "30px", textAlign: "left"}}>
                            Select Payment Method
                        </h3>

                        {(this.props.users.selectedPaymentMethod)
                            ?
                            <div style={{ overflow: "hidden" }}>

                                <Tabs
                                    inkBarStyle={{ display: 'none' }}
                                    className="payment-type-tabs"
                                    onChange={this.handleActive}
                                    value={(this.props.users.selectedPaymentMethod === "paypal" || this.props.users.selectedPaymentMethod === "laybuy") ? this.props.users.selectedPaymentMethod : this.props.users.selectedStripeMethod}
                                >

                                    {(paymentMethods["card"].status) &&
                                    <Tab id="creditCardButton"
                                         label={<div><img className="mr-2" src={payByCardIcon} /></div>} value="card"

                                         className={(this.props.users.selectedStripeMethod === "card") ? "active-tab" : ""}
                                    >
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                        <div className="paymentTabContent">


                                            <h2 style={{ fontSize: "14px", color: "black", marginTop: "0" }}>
                                                <img src={blackcardIcon} style={{ marginRight: "10px" }} /> Pay by card
                                            </h2>


                                            <StripeInput className="card-number" />

                                            <div style={{ margin: "0px 0 20px 0" }}>
                                                <Checkbox
                                                    id="saveCardCheckBox"
                                                    label="Save card details for next time."
                                                    name="save_card"
                                                    style={{
                                                        minWidth: "100%",
                                                        marginTop: "20px",
                                                        marginBottom: "10px",
                                                        fontSize: "12px"
                                                    }}
                                                    labelStyle={{ fontSize: "14px" }}
                                                    checkedIcon={<img src={checkedIcon} />}
                                                    uncheckedIcon={<img src={uncheckedIcon} />}
                                                    className="custom_checkbox"
                                                />
                                            </div>

                                        </div>
                                    </Tab>
                                    }

                                    <Tab id="payPalButton" label={<div><img className="mr-2" src={paypalIcon2} /></div>}
                                         value="paypal"
                                         className={(this.props.users.selectedPaymentMethod === "paypal") ? "active-tab" : ""}>
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                    </Tab>

                                    {(paymentMethods["klarna"].status) &&

                                    <Tab id="klarnaButton" label={<div><img className="mr-2" src={klarnaIcon} /></div>}

                                         value="klarna"
                                         className={(this.props.users.selectedStripeMethod === "klarna") ? "active-tab" : ""}>
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                        <Elements>
                                            <KlarnaForm />
                                        </Elements>

                                    </Tab>
                                    }

                                    {(paymentMethods["laybuy"].status) && this.props.cart.total < laybuyAmountLimit &&
                                    <Tab id="laybuyButton"
                                         label={<div><img style={{ backgroundColor: "#786dff", borderRadius: "3px" }}
                                                          className="mr-2" src={paymentIcons.laybuy} /></div>}
                                         value="laybuy"
                                         className={(this.props.users.selectedPaymentMethod === "laybuy") ? "active-tab" : ""}>
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                        <div>
                                            <Laybuy handleDetails={this.handleNext} />
                                        </div>
                                    </Tab>
                                    }

                                    {(paymentMethods["google_pay"].status) &&
                                    <Tab id="google_pay"
                                         label={<div><img className="mr-2" src={googlepayicon} /></div>}
                                         value="google_pay"
                                         className={(this.props.users.selectedStripeMethod === "google_pay") ? "active-tab" : ""}>
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                        <div>
                                        </div>
                                    </Tab>
                                    }


                                    {(paymentMethods["alipay"].status) &&

                                    <Tab id="alipayButton" label={<div><img className="mr-2" src={alipayicon} /></div>} value="alipay"
                                         className={(this.props.users.selectedStripeMethod === "alipay") ? "active-tab" : ""}>
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                        <div>
                                            <Elements>
                                                <Alipay />
                                            </Elements>
                                        </div>
                                    </Tab>

                                    }

                                    {(paymentMethods["apple_pay"].status) && isIOS && isSafari &&
                                    <Tab
                                        id="applePayButton" label={<div><img className="mr-2" src={paymentIcons.apple_pay} /></div>}
                                        value="apple_pay"
                                        className={this.props.users.selectedStripeMethod == "apple_pay" ? "active-tab" : ""}
                                    >
                                        <ReCaptcha
                                            sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT_KEY}
                                            action='payment'
                                            verifyCallback={this.verifyCallback}
                                        />
                                        <Elements>
                                            <ApplePay />
                                        </Elements>
                                    </Tab>


                                    }


                                    <Tab className="more-button" value="return">

                                    </Tab>
                                </Tabs>
                                {
                                    this.props.users.selectedStripeMethod === 'google_pay' &&
                                    <Elements>
                                        <Paybutton />
                                    </Elements>
                                }
                                <p style={{ fontSize: "14px", marginBottom: "25px", color: "black" }}>By placing your
                                    order you are agreeing to accept our <Link
                                        style={{ textAlign: "right", margin: "10px 0", fontWeight: "500" }}
                                        to={"/page/terms-conditions?checkoutSessionId=" + this.props.users.checkoutSessionId + extra_url}>terms
                                        and conditions</Link> and <Link
                                        style={{ textAlign: "right", margin: "10px 0", fontWeight: "500" }}
                                        to={"/page/privacy?checkoutSessionId=" + this.props.users.checkoutSessionId + extra_url}>privacy
                                        policy</Link>.</p>

                                {(!this.props.users.authenticated &&

                                    <div>
                                        <p style={{ fontSize: "14px", fontWeight: "bold", color: "black" }}>Select how you
                                            would like to receive marketing content from us. (Optional)</p>
                                        <div className="col-md-12">
                                            <div className="row marketing-options">
                                                <div className="col-md-3 col-xs-6" style={{ padding: "0" }}>
                                                    <Checkbox
                                                        id="email_subs"
                                                        label="By email"
                                                        name="email_subs"
                                                        onClick={this.subscribeMethod}
                                                        checked={subscribeMethods.includes("email_subs")}
                                                        style={{
                                                            minWidth: "100%",
                                                            marginTop: "20px",
                                                            marginBottom: "10px",
                                                            fontSize: "12px"
                                                        }}
                                                        labelStyle={{ fontSize: "14px" }}
                                                        className="custom_checkbox"
                                                        uncheckedIcon={<img src={uncheckedIcon} />}
                                                        checkedIcon={<img src={checkedIcon} />}
                                                    />
                                                </div>

                                                <div className="col-md-3 col-xs-6" style={{ padding: "0" }}>
                                                    <Checkbox
                                                        id="sms_subs"
                                                        label="By SMS"
                                                        name="sms_subs"
                                                        onClick={this.subscribeMethod}
                                                        checked={subscribeMethods.includes("sms_subs")}
                                                        style={{
                                                            minWidth: "100%",
                                                            marginTop: "20px",
                                                            marginBottom: "10px",
                                                            fontSize: "12px"
                                                        }}
                                                        labelStyle={{ fontSize: "14px" }}
                                                        className="custom_checkbox"
                                                        uncheckedIcon={<img src={uncheckedIcon} />}
                                                        checkedIcon={<img src={checkedIcon} />}
                                                    />
                                                </div>

                                                <div className="col-md-3 col-xs-6" style={{ padding: "0" }}>
                                                    <Checkbox
                                                        id="post_subs"
                                                        label="By post"
                                                        name="post_subs"
                                                        onClick={this.subscribeMethod}
                                                        checked={subscribeMethods.includes("post_subs")}
                                                        style={{
                                                            minWidth: "100%",
                                                            marginTop: "20px",
                                                            marginBottom: "10px",
                                                            fontSize: "12px"
                                                        }}
                                                        labelStyle={{ fontSize: "14px" }}
                                                        className="custom_checkbox"
                                                        uncheckedIcon={<img src={uncheckedIcon} />}
                                                        checkedIcon={<img src={checkedIcon} />}
                                                    />
                                                </div>

                                                <div className="col-md-3 col-xs-6" style={{ padding: "0" }}>
                                                    <Checkbox
                                                        id="all_subs"
                                                        label="All"
                                                        name="all_subs"
                                                        onClick={this.subscribeMethod}
                                                        checked={subscribeMethods.includes("all_subs")}
                                                        style={{
                                                            minWidth: "100%",
                                                            marginTop: "20px",
                                                            marginBottom: "10px",
                                                            fontSize: "12px"
                                                        }}
                                                        labelStyle={{ fontSize: "14px" }}
                                                        className="custom_checkbox"
                                                        uncheckedIcon={<img src={uncheckedIcon} />}
                                                        checkedIcon={<img src={checkedIcon} />}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>)}

                                {

                                    this.props.users.selectedPaymentMethod === "paypal"
                                        ?
                                        <PaypalExpressCheckout />
                                        :
                                        this.props.users.selectedStripeMethod != "google_pay" && this.props.users.selectedStripeMethod != "apple_pay" &&
                                        this.props.users.stripeCompleted || this.props.users.selectedStripeMethod === "alipay" && this.props.users.selectedPaymentMethod !== "laybuy"
                                            ?
                                            [
                                                (!this.props.users.loading
                                                    &&
                                                    <div key={Math.floor(Math.random() * 1000)}>
                                                        <button
                                                            id="paySecurelyButton"
                                                            style={{ marginTop: "20px" }}
                                                            onClick={this.handleNext}
                                                            className="dark-green-btn2"
                                                        >
                                                            <Icon
                                                                className="paySecurelyIcon"
                                                                name="lock" />
                                                            Pay Securely
                                                        </button>
                                                        <p style={{fontSize:"12px", color:"#999"}}>This site is protected by reCAPTCHA and the Google <br/>
                                                            <a href="https://policies.google.com/privacy">Privacy Policy</a> and
                                                            <a href="https://policies.google.com/terms">Terms of Service</a> apply.
                                                        </p>
                                                    </div>

                                                )
                                            ]
                                            :
                                            this.props.users.selectedStripeMethod != "google_pay" && this.props.users.selectedStripeMethod !== "apple_pay" &&

                                            this.props.users.selectedPaymentMethod !== "laybuy" && this.props.users.selectedStripeMethod !== "alipay" ?
                                                <div key={Math.floor(Math.random() * 1000)}>
                                                    <button
                                                        id="paySecurelyButton"
                                                        style={{ marginTop: "20px" }}
                                                        className="light-green-btn2"
                                                    >
                                                        <Icon
                                                            className="paySecurelyIcon"
                                                            name="lock" />

                                                        Pay Securely

                                                    </button>
                                                    <p className="captcha-text">This site is protected by reCAPTCHA and the Google <br/>
                                                        <a href="https://policies.google.com/privacy">Privacy Policy</a> and <a href="https://policies.google.com/terms"> Terms of Service</a> apply.
                                                    </p>
                                                </div> : null

                                }

                            </div>
                            :
                            <div style={{ overflow: "hidden" }}>

                                {(paymentMethods["card"].status) &&
                                <div className={paymentIconClass} id="creditCardButton"
                                     onClick={this.handleActive.bind(this, "card")}>
                                    <div>
                                        <img src={payByCardIcon} />
                                        <p>pay by card</p>
                                    </div>
                                </div>
                                }

                                <div className={paymentIconClass} id="payPalButton"
                                     onClick={this.handleActive.bind(this, "paypal")}>
                                    <div>
                                        <img src={paypalIcon2} />
                                        <p>paypal</p>
                                    </div>
                                </div>


                                {(paymentMethods["alipay"].status) &&
                                <div className={paymentIconClass} id="alipayButton"
                                     onClick={this.handleActive.bind(this, "alipay")}>
                                    <div>
                                        <img src={alipayicon} />
                                        <p>Alipay</p>
                                    </div>
                                </div>
                                }

                                {(paymentMethods["laybuy"].status) && this.props.cart.total < laybuyAmountLimit &&
                                <div className={paymentIconClass} id="laybuyButton"
                                     onClick={this.handleActive.bind(this, "laybuy")}>
                                    <div>
                                        <img style={{ backgroundColor: "#786dff", borderRadius: "3px" }}
                                             src={paymentIcons.laybuy} />
                                        <p>Laybuy</p>
                                    </div>
                                </div>
                                }

                                {(paymentMethods["klarna"].status) &&
                                <div className={paymentIconClass} id="klarnaButton"
                                     onClick={this.handleActive.bind(this, "klarna")}>
                                    <div>
                                        <img src={klarnaIcon} />
                                        <p>klarna</p>
                                    </div>
                                </div>
                                }

                                {paymentMethods["google_pay"].status &&
                                <div id="google_pay" className={paymentIconClass}
                                     onClick={this.handleActive.bind(this, "google_pay")}>
                                    <div>
                                        <img className="google_pay" style={{ height: "70px" }}
                                             src={googlepayicon} />
                                        <p>Google Pay</p>
                                    </div>
                                </div>


                                }

                                {paymentMethods["apple_pay"].status && isIOS && isSafari &&
                                <div className="paymentTypeIcon col-sm-3 col-xs-3" id="applePayButton"
                                     onClick={this.handleActive.bind(this, "apple_pay")}>
                                    <div>
                                        <img src={paymentIcons.apple_pay}/>
                                        <p>Apple Pay</p>
                                    </div>
                                </div>

                                }

                                <div className="col-sm-12">
                                    {
                                        this.props.restrictedProduct &&  this.props.quantityRestricted &&   <p style={{
                                            marginLeft: "-10px",
                                            fontSize: "14px",
                                            float: "left",
                                            color: "red"
                                        }}>Sorry, you are only able to purchase 1 of these products per
                                            order</p>
                                    }
                                    {
                                        this.props.restrictedProduct && this.props.addressRestricted &&
                                        <p style={{ marginLeft: "-10px", fontSize: "14px", float: "left", color:"red" }}>Sorry, this product is only available to customers purchasing inside the UK.</p>
                                    }

                                    {
                                        !this.props.quantityRestricted && !this.props.addressRestricted &&
                                        <p style={{ marginLeft: "-10px", fontSize: "14px", float: "left" }}>Please select a
                                            payment method(above).</p>
                                    }

                                </div>

                            </div>
                        }


                    </div>
                }
            </div >
        );
    }
}


/*export default PaymentSelection;*/

const mapStateToProps = (state) => {

    return {
        data: state,
        users: state.users,
        address: state.form.address,
        addressBilling: state.form.addressBilling,
        customer: state.form.customer,
        customerErrors: state.errors.customerErrors,
        addressErrors: state.errors.addressErrors,
        usersErrors: state.errors.usersErrors,
        ui: state.ui,
        cart: state.cart,
        payments: state.payments,
        ...state.errors.cartErrors
    }

};

const mapDispatchToProps = (dispatch) => {

    return Object.assign({}, bindActionCreators({
        setSelectedPaymentMethod,
        setSelectedStripeMethod,
        setErrors,
        setLoading,
        setLoadingPayStatus,
        setAlertShow,
        setStripeCompleted,
        setCardNumberCompleted,
        setCardExpiryCompleted,
        setCardCvcCompleted,
        setCardError,
        setStepperIndex,
        setStepFinished,
        setSubscribeMethod,
        setSelectedSavedCard,
        setSelectedSavedCardFocus,
        updateCustomerParaspar,
        updateOrderSub,
        updateOrderUnlockd,
        requestBraintreeToken,
        setInitialisedBraintree,
        //customer
        setFirstNameError: customerErr.setFirstNameError,
        setLastNameError: customerErr.setLastNameError,
        setEmailError: customerErr.setEmailError,
        setPhoneError: customerErr.setPhoneError,
        setTitleError: customerErr.setTitleError,
        //shipping address
        setAddressFirstNameError: addressErr.setFirstNameError,
        setAddressLastNameError: addressErr.setLastNameError,
        setCompanyError: addressErr.setCompanyError,
        setAddressError: addressErr.setAddressError,
        setCityError: addressErr.setCityError,
        setCountryError: addressErr.setCountryError,
        setAddressPhoneError: addressErr.setPhoneError,
        setPostCodeError: addressErr.setPostCodeError,
        //    billing address
        setBillingFirstNameError: billingErr.setFirstNameBillingError,
        setBillingLastNameError: billingErr.setLastNameBillingError,
        setBillingCompanyError: billingErr.setCompanyError,
        setBillingAddressError: billingErr.setAddressError,
        setBillingCityError: billingErr.setCityError,
        setBillingCountryError: billingErr.setCountryError,
        setBillingPhoneError: billingErr.setPhoneError,
        setShippingMethodError: billingErr.setShippingMethodError,
        setPostCodeBillingError: billingErr.setPostCodeBillingError,
        setTitleBillingError: billingErr.setTitleBillingError,

        setGTM,
        updateCustomerApi,
        updateCustomerDelivery,
        setDeliveryAddressEdit,
        setManualAddress,
        updateCartShipping,
        setCollectManual: collectActions.setManual,
        setPaymentAuthCallError,
        setFinished,
        setShipping: billingActions.setShipping,
        setManualBillingAddress: billingActions.setManualBillingAddress,
        setRecaptchaToken
    }, dispatch), {});
};


export default connect(mapStateToProps, mapDispatchToProps)(PaymentSelection);
