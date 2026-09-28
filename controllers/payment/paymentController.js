const axios = require("axios");
const qs = require("qs");
const sha512 = require("js-sha512");

/* =========================================================
   GENERATE EASEBUZZ HASH
========================================================= */

const generateHash = ({
  key,
  salt,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = "",
  udf2 = "",
  udf3 = "",
  udf4 = "",
  udf5 = "",
  udf6 = "",
  udf7 = "",
  udf8 = "",
  udf9 = "",
  udf10 = "",
}) => {
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    udf6,
    udf7,
    udf8,
    udf9,
    udf10,
    salt,
  ].join("|");

  return sha512.sha512(hashString);
};


/* =========================================================
   INITIATE PAYMENT
========================================================= */

const initiatePayment = async (req, res) => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      phone,
      email,
      udf1 = "",
      udf2 = "",
    } = req.body;


    /* -----------------------------------------------------
       BASIC VALIDATION
    ----------------------------------------------------- */

    if (
      !txnid ||
      !amount ||
      !productinfo ||
      !firstname ||
      (!phone && !email)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email or mobile number is required",
      });
    }


    /* -----------------------------------------------------
       EASEBUZZ CREDENTIALS
    ----------------------------------------------------- */

    const key =
      process.env.EASEBUZZ_KEY;

    const salt =
      process.env.EASEBUZZ_SALT;


    if (!key || !salt) {
      return res.status(500).json({
        success: false,
        message:
          "Easebuzz credentials are not configured",
      });
    }


    /* -----------------------------------------------------
       BACKEND URL VALIDATION
    ----------------------------------------------------- */

    if (!process.env.BACKEND_URL) {
      return res.status(500).json({
        success: false,
        message:
          "BACKEND_URL is not configured",
      });
    }


    /* -----------------------------------------------------
       GENERATE HASH
    ----------------------------------------------------- */

    const hash =
      generateHash({
        key,
        salt,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        udf1,
        udf2,
      });


    /* -----------------------------------------------------
       PAYMENT DATA
    ----------------------------------------------------- */

    const paymentData =
      qs.stringify({
        key,
        txnid,
        amount,
        productinfo,
        firstname,

        phone:
          phone || "",

        email:
          email || "",

        udf1,
        udf2,

        surl:
          `${process.env.BACKEND_URL}/api/payment/success`,

        furl:
          `${process.env.BACKEND_URL}/api/payment/failure`,

        hash,
      });


    console.log(
      "========== EASEBUZZ INITIATE =========="
    );

    console.log({
      environment:
        process.env.EASEBUZZ_ENV,

      txnid,

      amount,

      firstname,

      email,

      phone,

      surl:
        `${process.env.BACKEND_URL}/api/payment/success`,

      furl:
        `${process.env.BACKEND_URL}/api/payment/failure`,
    });


    /* -----------------------------------------------------
       EASEBUZZ URL
    ----------------------------------------------------- */

    const easebuzzUrl =
      process.env.EASEBUZZ_ENV === "test"
        ? "https://testpay.easebuzz.in/payment/initiateLink"
        : "https://pay.easebuzz.in/payment/initiateLink";


    /* -----------------------------------------------------
       CALL EASEBUZZ
    ----------------------------------------------------- */

    const response =
      await axios.post(
        easebuzzUrl,
        paymentData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",

            Accept:
              "application/json",
          },
        }
      );


    console.log(
      "Easebuzz response:",
      response.data
    );


    /* -----------------------------------------------------
       EASEBUZZ FAILED
    ----------------------------------------------------- */

    if (
      !response.data ||
      Number(response.data.status) !== 1
    ) {
      return res.status(400).json({
        success: false,

        message:
          response.data?.error_desc ||
          "Easebuzz payment initiation failed",

        data:
          response.data,
      });
    }


    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    return res.status(200).json({
      success: true,

      message:
        "Payment initiated successfully",

      data:
        response.data,
    });

  } catch (error) {

    console.error(
      "Easebuzz error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to initiate payment",

      error:
        error.response?.data ||
        error.message,
    });
  }
};


/* =========================================================
   PAYMENT SUCCESS
========================================================= */

/* =========================================================
   PAYMENT SUCCESS
========================================================= */

const paymentSuccess = async (req, res) => {
    try {
      console.log(
        "========== EASEBUZZ SUCCESS =========="
      );
  
      console.log("Easebuzz Success Data:", req.body);
  
      const {
        txnid = "",
        amount = "",
        easepayid = "",
        status = "",
        productinfo = "",
      } = req.body;
  
      // Frontend success page
      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";
  
      const successUrl =
        `${frontendUrl}/payment-success` +
        `?txnid=${encodeURIComponent(txnid)}` +
        `&easepayid=${encodeURIComponent(easepayid)}` +
        `&amount=${encodeURIComponent(amount)}` +
        `&status=${encodeURIComponent(status)}` +
        `&productinfo=${encodeURIComponent(productinfo)}`;
  
      console.log(
        "Redirecting to:",
        successUrl
      );
  
      return res.redirect(successUrl);
  
    } catch (error) {
  
      console.error(
        "Payment success handling error:",
        error
      );
  
      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";
  
      return res.redirect(
        `${frontendUrl}/payment-failure`
      );
    }
  };


/* =========================================================
   PAYMENT FAILURE
========================================================= */

/* =========================================================
   PAYMENT FAILURE
========================================================= */

const paymentFailure = async (req, res) => {
    try {
      console.log(
        "========== EASEBUZZ FAILURE =========="
      );
  
      console.log(
        "Easebuzz Failure Data:",
        req.body
      );
  
      const {
        txnid = "",
        amount = "",
        error_Message = "",
        error = "",
        status = "failed",
      } = req.body;
  
      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";
  
      const failureUrl =
        `${frontendUrl}/payment-failure` +
        `?txnid=${encodeURIComponent(txnid)}` +
        `&amount=${encodeURIComponent(amount)}` +
        `&status=${encodeURIComponent(status)}` +
        `&message=${encodeURIComponent(
          error_Message || error || "Payment failed"
        )}`;
  
      console.log(
        "Redirecting to:",
        failureUrl
      );
  
      return res.redirect(failureUrl);
  
    } catch (error) {
  
      console.error(
        "Payment failure handling error:",
        error
      );
  
      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";
  
      return res.redirect(
        `${frontendUrl}/payment-failure`
      );
    }
  };


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  initiatePayment,
  paymentSuccess,
  paymentFailure,
};