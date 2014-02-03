var formatting = require('../format');
var parameters = require('../parameters');

var MAC_VERSION1 = [
  'NET_VERSION',
  'NET_STAMP',
  'NET_SELLER_ID',
  'NET_AMOUNT',
  'NET_REF',
  'NET_DATE',
  'NET_CUR'
];
var MAC_VERSION2 = MAC_VERSION1.concat([
  'NET_RETURN',
  'NET_CANCEL',
  'NET_REJECT'
]);
var MAC_VERSION3 = MAC_VERSION2.concat(['NET_ALG']);

exports.mapParams = function (providerConfig, options) {
  validateParams(providerConfig, options);

  return {
    "NET_VERSION" : providerConfig.paymentVersion,
    "NET_STAMP" : options.requestId,
    "NET_SELLER_ID" : providerConfig.vendorId,
    "NET_AMOUNT" : formatting.formatAmount(options.amount),
    "NET_CUR" : providerConfig.currency,
    "NET_REF" : formatting.formatToPaymentReference(options.requestId),
    "NET_DATE" : providerConfig.dueDate,
    "NET_MSG" : formatting.formatMessage(options.message),
    "NET_RETURN" : providerConfig.returnUrls.ok,
    "NET_CANCEL" : providerConfig.returnUrls.cancel,
    "NET_REJECT" : providerConfig.returnUrls.reject,
    "NET_CONFIRM" : providerConfig.confirm,
    "NET_ALG" : formatAlgorithm(providerConfig)
  };
};

function validateParams (providerConfig, options) {
  parameters.requireParams(options, ['requestId', 'amount']);
  parameters.requireParams(providerConfig,
    ['paymentVersion', 'vendorId', 'currency', 'dueDate', 'returnUrls', 'confirm']);

  parameters.requireInclusionIn(providerConfig, 'dueDate', ['EXPRESS']);
}

exports.algorithmType = function (bankConfig) {
  if (bankConfig.paymentVersion == "003") {
    return "sha256";
  } else {
    return "md5";
  }
};

exports.requestMacParams = function (providerConfig, formParams) {
  var macParams = macParamsForVersion(providerConfig.paymentVersion);
  return parameters.macParams(formParams, macParams, [], [providerConfig.checksumKey]);
};

function macParamsForVersion(paymentVersion) {
  switch (paymentVersion) {
    case "001": return MAC_VERSION1;
    case "002": return MAC_VERSION2;
    case "003": return MAC_VERSION3;
    default: throw new Error("Unknown payment version '" + paymentVersion + "'.");
  }
}

exports.macFormName = 'NET_MAC';

function formatAlgorithm (bankConfig) {
  return exports.algorithmType(bankConfig) === "sha256" ? "03" : undefined;
}