export const formatMoney = (res: any, curr?: any) => {
	if (typeof res === "string" && res.startsWith("BigInt::")) {
		res = res.substring(`BigInt::`.length);
	}
	const formattedAmount = new Intl.NumberFormat("id-ID", {
		minimumFractionDigits: 0,
	}).format(res);
	let prefix = "";
	if ( typeof curr === "string" && curr !=="" ) {
		prefix = curr + " ";
	}
	return prefix + formattedAmount + ",-";
};
export default formatMoney;
