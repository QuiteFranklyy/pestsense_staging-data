/**
 * Description:
 * Create Author/Date:
 * Modified Author/Date Date:
 * Version:
 */

/**
 * Initialise script state (run once at startup)
 */


 const tzStrings = [
	{label:"(GMT-12:00) International Date Line West","value":"Etc/GMT+12"},
	{label:"(GMT-11:00) Midway Island, Samoa","value":"Pacific/Midway"},
	{label:"(GMT-10:00) Hawaii","value":"Pacific/Honolulu"},
	{label:"(GMT-09:00) Alaska","value":"US/Alaska"},
	{label:"(GMT-08:00) Pacific Time (US & Canada)","value":"America/Los_Angeles"},
	{label:"(GMT-08:00) Tijuana, Baja California","value":"America/Tijuana"},
	{label:"(GMT-07:00) Arizona","value":"US/Arizona"},
	{label:"(GMT-07:00) Chihuahua, La Paz, Mazatlan","value":"America/Chihuahua"},
	{label:"(GMT-07:00) Mountain Time (US & Canada)","value":"US/Mountain"},
	{label:"(GMT-06:00) Central America","value":"America/Managua"},
	{label:"(GMT-06:00) Central Time (US & Canada)","value":"US/Central"},
	{label:"(GMT-06:00) Guadalajara, Mexico City, Monterrey","value":"America/Mexico_City"},
	{label:"(GMT-06:00) Saskatchewan","value":"Canada/Saskatchewan"},
	{label:"(GMT-05:00) Bogota, Lima, Quito, Rio Branco","value":"America/Bogota"},
	{label:"(GMT-05:00) Eastern Time (US & Canada)","value":"US/Eastern"},
	{label:"(GMT-05:00) Indiana (East)","value":"US/East-Indiana"},
	{label:"(GMT-04:00) Atlantic Time (Canada)","value":"Canada/Atlantic"},
	{label:"(GMT-04:00) Caracas, La Paz","value":"America/Caracas"},
	{label:"(GMT-04:00) Manaus","value":"America/Manaus"},
	{label:"(GMT-04:00) Santiago","value":"America/Santiago"},
	{label:"(GMT-03:30) Newfoundland","value":"Canada/Newfoundland"},
	{label:"(GMT-03:00) Brasilia","value":"America/Sao_Paulo"},
	{label:"(GMT-03:00) Buenos Aires, Georgetown","value":"America/Argentina/Buenos_Aires"},
	{label:"(GMT-03:00) Greenland","value":"America/Godthab"},
	{label:"(GMT-03:00) Montevideo","value":"America/Montevideo"},
	{label:"(GMT-02:00) Mid-Atlantic","value":"America/Noronha"},
	{label:"(GMT-01:00) Cape Verde Is.","value":"Atlantic/Cape_Verde"},
	{label:"(GMT-01:00) Azores","value":"Atlantic/Azores"},
	{label:"(GMT+00:00) Casablanca, Monrovia, Reykjavik","value":"Africa/Casablanca"},
	{label:"(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London","value":"Etc/Greenwich"},
	{label:"(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna","value":"Europe/Amsterdam"},
	{label:"(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague","value":"Europe/Belgrade"},
	{label:"(GMT+01:00) Brussels, Copenhagen, Madrid, Paris","value":"Europe/Brussels"},
	{label:"(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb","value":"Europe/Sarajevo"},
	{label:"(GMT+01:00) West Central Africa","value":"Africa/Lagos"},
	{label:"(GMT+02:00) Amman","value":"Asia/Amman"},
	{label:"(GMT+02:00) Athens, Bucharest, Istanbul","value":"Europe/Athens"},
	{label:"(GMT+02:00) Beirut","value":"Asia/Beirut"},
	{label:"(GMT+02:00) Cairo","value":"Africa/Cairo"},
	{label:"(GMT+02:00) Harare, Pretoria","value":"Africa/Harare"},
	{label:"(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius","value":"Europe/Helsinki"},
	{label:"(GMT+02:00) Jerusalem","value":"Asia/Jerusalem"},
	{label:"(GMT+02:00) Minsk","value":"Europe/Minsk"},
	{label:"(GMT+02:00) Windhoek","value":"Africa/Windhoek"},
	{label:"(GMT+03:00) Kuwait, Riyadh, Baghdad","value":"Asia/Kuwait"},
	{label:"(GMT+03:00) Moscow, St. Petersburg, Volgograd","value":"Europe/Moscow"},
	{label:"(GMT+03:00) Nairobi","value":"Africa/Nairobi"},
	{label:"(GMT+03:00) Tbilisi","value":"Asia/Tbilisi"},
	{label:"(GMT+03:30) Tehran","value":"Asia/Tehran"},
	{label:"(GMT+04:00) Abu Dhabi, Muscat","value":"Asia/Muscat"},
	{label:"(GMT+04:00) Baku","value":"Asia/Baku"},
	{label:"(GMT+04:00) Yerevan","value":"Asia/Yerevan"},
	{label:"(GMT+04:30) Kabul","value":"Asia/Kabul"},
	{label:"(GMT+05:00) Yekaterinburg","value":"Asia/Yekaterinburg"},
	{label:"(GMT+05:00) Islamabad, Karachi, Tashkent","value":"Asia/Karachi"},
	{label:"(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi","value":"Asia/Calcutta"},
	{label:"(GMT+05:30) Sri Jayawardenapura","value":"Asia/Calcutta"},
	{label:"(GMT+05:45) Kathmandu","value":"Asia/Katmandu"},
	{label:"(GMT+06:00) Almaty, Novosibirsk","value":"Asia/Almaty"},
	{label:"(GMT+06:00) Astana, Dhaka","value":"Asia/Dhaka"},
	{label:"(GMT+06:30) Yangon (Rangoon)","value":"Asia/Rangoon"},
	{label:"(GMT+07:00) Bangkok, Hanoi, Jakarta","value":"Asia/Bangkok"},
	{label:"(GMT+07:00) Krasnoyarsk","value":"Asia/Krasnoyarsk"},
	{label:"(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi","value":"Asia/Hong_Kong"},
	{label:"(GMT+08:00) Kuala Lumpur, Singapore","value":"Asia/Kuala_Lumpur"},
	{label:"(GMT+08:00) Irkutsk, Ulaan Bataar","value":"Asia/Irkutsk"},
	{label:"(GMT+08:00) Perth","value":"Australia/Perth"},
	{label:"(GMT+08:00) Taipei","value":"Asia/Taipei"},
	{label:"(GMT+09:00) Osaka, Sapporo, Tokyo","value":"Asia/Tokyo"},
	{label:"(GMT+09:00) Seoul","value":"Asia/Seoul"},
	{label:"(GMT+09:00) Yakutsk","value":"Asia/Yakutsk"},
	{label:"(GMT+09:30) Adelaide","value":"Australia/Adelaide"},
	{label:"(GMT+09:30) Darwin","value":"Australia/Darwin"},
	{label:"(GMT+10:00) Brisbane","value":"Australia/Brisbane"},
	{label:"(GMT+10:00) Canberra, Melbourne, Sydney","value":"Australia/Canberra"},
	{label:"(GMT+10:00) Hobart","value":"Australia/Hobart"},
	{label:"(GMT+10:00) Guam, Port Moresby","value":"Pacific/Guam"},
	{label:"(GMT+10:00) Vladivostok","value":"Asia/Vladivostok"},
	{label:"(GMT+11:00) Magadan, Solomon Is., New Caledonia","value":"Asia/Magadan"},
	{label:"(GMT+12:00) Auckland, Wellington","value":"Pacific/Auckland"},
	{label:"(GMT+12:00) Fiji, Kamchatka, Marshall Is.","value":"Pacific/Fiji"},
	{label:"(GMT+13:00) Nuku'alofa","value":"Pacific/Tongatapu"}
];

 var countryList = [ 
    {name: 'Afghanistan', code: 'AF'}, 
    {name: 'Åland Islands', code: 'AX'}, 
    {name: 'Albania', code: 'AL'}, 
    {name: 'Algeria', code: 'DZ'}, 
    {name: 'American Samoa', code: 'AS'}, 
    {name: 'AndorrA', code: 'AD'}, 
    {name: 'Angola', code: 'AO'}, 
    {name: 'Anguilla', code: 'AI'}, 
    {name: 'Antarctica', code: 'AQ'}, 
    {name: 'Antigua and Barbuda', code: 'AG'}, 
    {name: 'Argentina', code: 'AR'}, 
    {name: 'Armenia', code: 'AM'}, 
    {name: 'Aruba', code: 'AW'}, 
    {name: 'Australia', code: 'AU'}, 
    {name: 'Austria', code: 'AT'}, 
    {name: 'Azerbaijan', code: 'AZ'}, 
    {name: 'Bahamas', code: 'BS'}, 
    {name: 'Bahrain', code: 'BH'}, 
    {name: 'Bangladesh', code: 'BD'}, 
    {name: 'Barbados', code: 'BB'}, 
    {name: 'Belarus', code: 'BY'}, 
    {name: 'Belgium', code: 'BE'}, 
    {name: 'Belize', code: 'BZ'}, 
    {name: 'Benin', code: 'BJ'}, 
    {name: 'Bermuda', code: 'BM'}, 
    {name: 'Bhutan', code: 'BT'}, 
    {name: 'Bolivia', code: 'BO'}, 
    {name: 'Bosnia and Herzegovina', code: 'BA'}, 
    {name: 'Botswana', code: 'BW'}, 
    {name: 'Bouvet Island', code: 'BV'}, 
    {name: 'Brazil', code: 'BR'}, 
    {name: 'British Indian Ocean Territory', code: 'IO'}, 
    {name: 'Brunei Darussalam', code: 'BN'}, 
    {name: 'Bulgaria', code: 'BG'}, 
    {name: 'Burkina Faso', code: 'BF'}, 
    {name: 'Burundi', code: 'BI'}, 
    {name: 'Cambodia', code: 'KH'}, 
    {name: 'Cameroon', code: 'CM'}, 
    {name: 'Canada', code: 'CA'}, 
    {name: 'Cape Verde', code: 'CV'}, 
    {name: 'Cayman Islands', code: 'KY'}, 
    {name: 'Central African Republic', code: 'CF'}, 
    {name: 'Chad', code: 'TD'}, 
    {name: 'Chile', code: 'CL'}, 
    {name: 'China', code: 'CN'}, 
    {name: 'Christmas Island', code: 'CX'}, 
    {name: 'Cocos (Keeling) Islands', code: 'CC'}, 
    {name: 'Colombia', code: 'CO'}, 
    {name: 'Comoros', code: 'KM'}, 
    {name: 'Congo', code: 'CG'}, 
    {name: 'Congo, The Democratic Republic of the', code: 'CD'}, 
    {name: 'Cook Islands', code: 'CK'}, 
    {name: 'Costa Rica', code: 'CR'}, 
    {name: 'Cote D\'Ivoire', code: 'CI'}, 
    {name: 'Croatia', code: 'HR'}, 
    {name: 'Cuba', code: 'CU'}, 
    {name: 'Cyprus', code: 'CY'}, 
    {name: 'Czech Republic', code: 'CZ'}, 
    {name: 'Denmark', code: 'DK'}, 
    {name: 'Djibouti', code: 'DJ'}, 
    {name: 'Dominica', code: 'DM'}, 
    {name: 'Dominican Republic', code: 'DO'}, 
    {name: 'Ecuador', code: 'EC'}, 
    {name: 'Egypt', code: 'EG'}, 
    {name: 'El Salvador', code: 'SV'}, 
    {name: 'Equatorial Guinea', code: 'GQ'}, 
    {name: 'Eritrea', code: 'ER'}, 
    {name: 'Estonia', code: 'EE'}, 
    {name: 'Ethiopia', code: 'ET'}, 
    {name: 'Falkland Islands (Malvinas)', code: 'FK'}, 
    {name: 'Faroe Islands', code: 'FO'}, 
    {name: 'Fiji', code: 'FJ'}, 
    {name: 'Finland', code: 'FI'}, 
    {name: 'France', code: 'FR'}, 
    {name: 'French Guiana', code: 'GF'}, 
    {name: 'French Polynesia', code: 'PF'}, 
    {name: 'French Southern Territories', code: 'TF'}, 
    {name: 'Gabon', code: 'GA'}, 
    {name: 'Gambia', code: 'GM'}, 
    {name: 'Georgia', code: 'GE'}, 
    {name: 'Germany', code: 'DE'}, 
    {name: 'Ghana', code: 'GH'}, 
    {name: 'Gibraltar', code: 'GI'}, 
    {name: 'Greece', code: 'GR'}, 
    {name: 'Greenland', code: 'GL'}, 
    {name: 'Grenada', code: 'GD'}, 
    {name: 'Guadeloupe', code: 'GP'}, 
    {name: 'Guam', code: 'GU'}, 
    {name: 'Guatemala', code: 'GT'}, 
    {name: 'Guernsey', code: 'GG'}, 
    {name: 'Guinea', code: 'GN'}, 
    {name: 'Guinea-Bissau', code: 'GW'}, 
    {name: 'Guyana', code: 'GY'}, 
    {name: 'Haiti', code: 'HT'}, 
    {name: 'Heard Island and Mcdonald Islands', code: 'HM'}, 
    {name: 'Holy See (Vatican City State)', code: 'VA'}, 
    {name: 'Honduras', code: 'HN'}, 
    {name: 'Hong Kong', code: 'HK'}, 
    {name: 'Hungary', code: 'HU'}, 
    {name: 'Iceland', code: 'IS'}, 
    {name: 'India', code: 'IN'}, 
    {name: 'Indonesia', code: 'ID'}, 
    {name: 'Iran, Islamic Republic Of', code: 'IR'}, 
    {name: 'Iraq', code: 'IQ'}, 
    {name: 'Ireland', code: 'IE'}, 
    {name: 'Isle of Man', code: 'IM'}, 
    {name: 'Israel', code: 'IL'}, 
    {name: 'Italy', code: 'IT'}, 
    {name: 'Jamaica', code: 'JM'}, 
    {name: 'Japan', code: 'JP'}, 
    {name: 'Jersey', code: 'JE'}, 
    {name: 'Jordan', code: 'JO'}, 
    {name: 'Kazakhstan', code: 'KZ'}, 
    {name: 'Kenya', code: 'KE'}, 
    {name: 'Kiribati', code: 'KI'}, 
    {name: 'Korea, Democratic People\'S Republic of', code: 'KP'}, 
    {name: 'Korea, Republic of', code: 'KR'}, 
    {name: 'Kuwait', code: 'KW'}, 
    {name: 'Kyrgyzstan', code: 'KG'}, 
    {name: 'Lao People\'S Democratic Republic', code: 'LA'}, 
    {name: 'Latvia', code: 'LV'}, 
    {name: 'Lebanon', code: 'LB'}, 
    {name: 'Lesotho', code: 'LS'}, 
    {name: 'Liberia', code: 'LR'}, 
    {name: 'Libyan Arab Jamahiriya', code: 'LY'}, 
    {name: 'Liechtenstein', code: 'LI'}, 
    {name: 'Lithuania', code: 'LT'}, 
    {name: 'Luxembourg', code: 'LU'}, 
    {name: 'Macao', code: 'MO'}, 
    {name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'}, 
    {name: 'Madagascar', code: 'MG'}, 
    {name: 'Malawi', code: 'MW'}, 
    {name: 'Malaysia', code: 'MY'}, 
    {name: 'Maldives', code: 'MV'}, 
    {name: 'Mali', code: 'ML'}, 
    {name: 'Malta', code: 'MT'}, 
    {name: 'Marshall Islands', code: 'MH'}, 
    {name: 'Martinique', code: 'MQ'}, 
    {name: 'Mauritania', code: 'MR'}, 
    {name: 'Mauritius', code: 'MU'}, 
    {name: 'Mayotte', code: 'YT'}, 
    {name: 'Mexico', code: 'MX'}, 
    {name: 'Micronesia, Federated States of', code: 'FM'}, 
    {name: 'Moldova, Republic of', code: 'MD'}, 
    {name: 'Monaco', code: 'MC'}, 
    {name: 'Mongolia', code: 'MN'}, 
    {name: 'Montserrat', code: 'MS'}, 
    {name: 'Morocco', code: 'MA'}, 
    {name: 'Mozambique', code: 'MZ'}, 
    {name: 'Myanmar', code: 'MM'}, 
    {name: 'Namibia', code: 'NA'}, 
    {name: 'Nauru', code: 'NR'}, 
    {name: 'Nepal', code: 'NP'}, 
    {name: 'Netherlands', code: 'NL'}, 
    {name: 'Netherlands Antilles', code: 'AN'}, 
    {name: 'New Caledonia', code: 'NC'}, 
    {name: 'New Zealand', code: 'NZ'}, 
    {name: 'Nicaragua', code: 'NI'}, 
    {name: 'Niger', code: 'NE'}, 
    {name: 'Nigeria', code: 'NG'}, 
    {name: 'Niue', code: 'NU'}, 
    {name: 'Norfolk Island', code: 'NF'}, 
    {name: 'Northern Mariana Islands', code: 'MP'}, 
    {name: 'Norway', code: 'NO'}, 
    {name: 'Oman', code: 'OM'}, 
    {name: 'Pakistan', code: 'PK'}, 
    {name: 'Palau', code: 'PW'}, 
    {name: 'Palestinian Territory, Occupied', code: 'PS'}, 
    {name: 'Panama', code: 'PA'}, 
    {name: 'Papua New Guinea', code: 'PG'}, 
    {name: 'Paraguay', code: 'PY'}, 
    {name: 'Peru', code: 'PE'}, 
    {name: 'Philippines', code: 'PH'}, 
    {name: 'Pitcairn', code: 'PN'}, 
    {name: 'Poland', code: 'PL'}, 
    {name: 'Portugal', code: 'PT'}, 
    {name: 'Puerto Rico', code: 'PR'}, 
    {name: 'Qatar', code: 'QA'}, 
    {name: 'Reunion', code: 'RE'}, 
    {name: 'Romania', code: 'RO'}, 
    {name: 'Russian Federation', code: 'RU'}, 
    {name: 'RWANDA', code: 'RW'}, 
    {name: 'Saint Helena', code: 'SH'}, 
    {name: 'Saint Kitts and Nevis', code: 'KN'}, 
    {name: 'Saint Lucia', code: 'LC'}, 
    {name: 'Saint Pierre and Miquelon', code: 'PM'}, 
    {name: 'Saint Vincent and the Grenadines', code: 'VC'}, 
    {name: 'Samoa', code: 'WS'}, 
    {name: 'San Marino', code: 'SM'}, 
    {name: 'Sao Tome and Principe', code: 'ST'}, 
    {name: 'Saudi Arabia', code: 'SA'}, 
    {name: 'Senegal', code: 'SN'}, 
    {name: 'Serbia and Montenegro', code: 'CS'}, 
    {name: 'Seychelles', code: 'SC'}, 
    {name: 'Sierra Leone', code: 'SL'}, 
    {name: 'Singapore', code: 'SG'}, 
    {name: 'Slovakia', code: 'SK'}, 
    {name: 'Slovenia', code: 'SI'}, 
    {name: 'Solomon Islands', code: 'SB'}, 
    {name: 'Somalia', code: 'SO'}, 
    {name: 'South Africa', code: 'ZA'}, 
    {name: 'South Georgia and the South Sandwich Islands', code: 'GS'}, 
    {name: 'Spain', code: 'ES'}, 
    {name: 'Sri Lanka', code: 'LK'}, 
    {name: 'Sudan', code: 'SD'}, 
    {name: 'Suriname', code: 'SR'}, 
    {name: 'Svalbard and Jan Mayen', code: 'SJ'}, 
    {name: 'Swaziland', code: 'SZ'}, 
    {name: 'Sweden', code: 'SE'}, 
    {name: 'Switzerland', code: 'CH'}, 
    {name: 'Syrian Arab Republic', code: 'SY'}, 
    {name: 'Taiwan, Province of China', code: 'TW'}, 
    {name: 'Tajikistan', code: 'TJ'}, 
    {name: 'Tanzania, United Republic of', code: 'TZ'}, 
    {name: 'Thailand', code: 'TH'}, 
    {name: 'Timor-Leste', code: 'TL'}, 
    {name: 'Togo', code: 'TG'}, 
    {name: 'Tokelau', code: 'TK'}, 
    {name: 'Tonga', code: 'TO'}, 
    {name: 'Trinidad and Tobago', code: 'TT'}, 
    {name: 'Tunisia', code: 'TN'}, 
    {name: 'Turkey', code: 'TR'}, 
    {name: 'Turkmenistan', code: 'TM'}, 
    {name: 'Turks and Caicos Islands', code: 'TC'}, 
    {name: 'Tuvalu', code: 'TV'}, 
    {name: 'Uganda', code: 'UG'}, 
    {name: 'Ukraine', code: 'UA'}, 
    {name: 'United Arab Emirates', code: 'AE'}, 
    {name: 'United Kingdom', code: 'GB'}, 
    {name: 'United States', code: 'US'}, 
    {name: 'United States Minor Outlying Islands', code: 'UM'}, 
    {name: 'Uruguay', code: 'UY'}, 
    {name: 'Uzbekistan', code: 'UZ'}, 
    {name: 'Vanuatu', code: 'VU'}, 
    {name: 'Venezuela', code: 'VE'}, 
    {name: 'Viet Nam', code: 'VN'}, 
    {name: 'Virgin Islands, British', code: 'VG'}, 
    {name: 'Virgin Islands, U.S.', code: 'VI'}, 
    {name: 'Wallis and Futuna', code: 'WF'}, 
    {name: 'Western Sahara', code: 'EH'}, 
    {name: 'Yemen', code: 'YE'}, 
    {name: 'Zambia', code: 'ZM'}, 
    {name: 'Zimbabwe', code: 'ZW'} 
  ];

Script.on("load", load);

function load() {
	var deleteAccountIcon = Script.getWidget("deleteAccountIcon");
	deleteAccountIcon.subscribe("pressed", async function () {
		var form = Script.getFormByKey("details");
		let res = await Client.confirm(`Are you sure you want to delete thie user ${form.username}?`, "Delete User", { confirmText: "Delete" });
		if (res) {
			Directory.deleteUser(form.username, async function (eventData) {
				if (eventData.value !== 1) {
					// Account not deleted.
					Log.info(`An error occured deleting the user ${form.username}. Please contact the system administrator.`);
					await Client.alert(`An error occured deleting the user ${form.username}. Please contact the system administrator.`);
				} else {
					Log.info(`User '${form.username} was successfully deleted.`);
				}
				Client.jumpToScreen("Manage Users");
			});
		}
	});

	ClientEvents.subscribe("addressChange", function (eventData) {
		let addrName = "";
		for (const component of eventData.value.address_components) {
			const componentType = component.types[0];
	
			switch (componentType) {
				case "street_number":
					addrName = `${component.long_name}`;
				case "route":
					Script.getWidget("addrInput").receiveValue(`${addrName} ${component.long_name}`);
					break;
				case "postal_code":
					Script.getWidget("zipInp").receiveValue(`${component.long_name}`);
					// formObj.pcode = `${component.long_name}`;
					break;
				case "administrative_area_level_1":
					Script.getWidget("stateInp").receiveValue(`${component.long_name}`);
					// formObj.state = `${component.short_name}`;
					break;
				case "locality":
					Script.getWidget("cityInp").receiveValue(`${component.long_name}`);
					// formObj.pcode = `${component.long_name}`;
					break;
			}
		}
	});

	//Populate country dropdown
	var countryDropdown = Script.getWidget("countryDropdown");
	var coll = new SensaCollection(["text", "value"], "text", {});
	var data = countryList.map(country => ({text: country.name, value: country.code}));

    populateAllUserAccessRoles();
	
	for (var i = 0;i<data.length;i++) {
		coll.add(data[i]);
	}
	countryDropdown.receiveTextValues(coll);
	countryDropdown.resetDefault();

	// Populate the timzone dropdown
	var tzData = tzStrings.map(tz => tz.label);
	var tzDropdown = Script.getWidget("tzDrop");
	tzDropdown.receiveList(tzData);

	var accountNames = Script.getState("accountInfo").getColumn("accountname");
	var accDrop = Script.getWidget("accDrop");
	accDrop.receiveList(accountNames);
	
	//Get dashboard, todo  make directory api.
	Database.readRecords("directory", "dash", function (eventData) {
		var dashDrop = Script.getWidget("dashDrop");
		var dashboards = eventData.value.getColumn("name");
		dashDrop.receiveList(dashboards);
		var user = Script.getState("user");
		var userDetails = Script.getState("userRecord").getFirst();
		var accountName = Script.getState("accountinfo").get(userDetails.accountid).accountname;
		accDrop.receiveValue(accountName);

		if (user != null) {
			console.log("updating the form");
			updateForm(user);
		}

		// Setup Permissions table.
		var permCollection = new SensaCollection(["permission"], "permission");
		var permissions = Object.keys(Directory.permissions);
		var userPermsTable = Script.getWidget("userPermsTable");
		var setPerms = [];

		Directory.getClientPermissions(function(data) {
			var perms = SensaCollection.load(data.value);
			var userPerms = perms.data[user];

			for (var i = 0; i < permissions.length; i++) {
				permCollection.add({
					permission: permissions[i],
				});
				if (userPerms[i + 1] == '1') {
					setPerms.push(permissions[i]);
				}
			}
			userPermsTable.receiveValue(permCollection);
			userPermsTable.selectRows(setPerms);
		});
	});

	ClientEvents.subscribe("changePass", function () {
		var user = Script.getState("user");
		if (user == null) {
			Log.warn("No user has been selected.");
			return;
		}

		var passDetails = Script.getForm("pass");

		Directory.changePassword(user, passDetails.oldPassInp, passDetails.newPassInp, passDetails.confNewInp);
		Log.info("Password changed.");
	});

	ClientEvents.subscribe("saveUser", save);
}

// TODO confirm can add in Directory.js 
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

async function save() {
	var user = Script.getState("user");
	if (user == null) {
		Log.warn("No user selected to save.");
		return;
	}

	let res = await Client.confirm("Are you sure you would like to save these changes?", "Save User Information", {confirmText: "Save"})
    if (res) {
        var formData = Script.getFormByKey("details");
        console.log(JSON.stringify(formData,null,4));
        if (formData.accessrole === "no role"){
            formData.accessrole = 0;
        }

        if (formData === null) return;
        formData.status = formData.status === true ? 1 : 0;
        formData.username = Script.getState("user");

        // confirm valid email address
        if (!validateEmail(formData.email)) {
            setTimeout(() => Script.getWidget("emailInp").setValidityMessage("Valid email address is required."), 0); 
            return;
        }

        // Swap account name for accoutnid;
        formData.accountid = Script.getState("accountInfo")
            .query(function (record, pk) {
                if (formData.accountname == record.accountname) return true;
            })
            .getFirst().accountid;

		// Get actual country name instead of code
        if (formData.country !== "") {
		    formData.country = countryList.find(x => x.code === formData.country).name;
        }

        // set last modified, format date in similar way to server 
        let today = new Date();
        let month = today.getMonth() + 1;
        month = month < 10 ? '0' + month : month;
        let date = today.getDate() + '/' + month + '/'+today.getFullYear();
        let hours = today.getHours();
        let minutes = today.getMinutes();
        let seconds = today.getSeconds();
        var ampm = today.getHours() >= 12 ? "PM" : "AM";
        hours = hours ? hours : 12; // make hour 0 become 12
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        let time = hours + ":" + minutes + ":" + seconds;
        let dateTime = date + ' ' + time + ' ' + ampm;
        // TODO find a way to use formatDate() from utils
        formData.lastmodified = dateTime;

        delete formData.accountname;

        if (formData.undefined) delete formData.undefined;

        var req = {};
		var dbFormData = JSON.parse(JSON.stringify(formData));
		delete dbFormData.userPermsTable;
        req[dbFormData] = dbFormData;
        Database.updateEntity("Directory", "users", req, async function (status) {
            if (status.value == 0) {
                Log.warn(`An error occured updating ${formData.username} details.`);
                await Client.alert(`An error occured updating ${formData.username} details.`, "Error");
            } else {
				// TODO update permissions table only if permissions have changed
				var perms = formData.userPermsTable.getColumn("permission");
				try {
					Directory.changePermissions(formData.username, perms);
					Client.jumpToScreen("Manage Users");
				} catch (ex) {
					Client.alert("User must have at least one permission", "Error");
				}
            }
        });
        Log.info("Updating user information.");
    }
}

Script.on("SCREENCHANGE", function () {
	//reset variables
	Script.removeState("user");
	return true;
});

function updateForm(username) {
	var collection = Script.getState("userRecord");
	if (collection == null) return;

	var createdOn = Script.getWidget("createdOn");
	createdOn.receiveValue(collection.getColumn("createdon"));

	var lastSeen = Script.getWidget("createdBy");
	lastSeen.receiveValue(collection.getColumn("createdby"));

	var createdOn = Script.getWidget("lastModified");
	createdOn.receiveValue(collection.getColumn("lastmodified"));

	var lastSeen = Script.getWidget("lastLogged");
	lastSeen.receiveValue(collection.getColumn("lastlogged"));

	collection = SensaCollection.load(collection);
	var record = collection.get(username);
	record.status = record.status == "Yes" ? 1 : 0;

    // rename the accessrole to be the text value instead of the ID
    var accessRoleId = record.accessrole;
	console.log("Access role id: " + accessRoleId + " TYPE: " + typeof accessRoleId);
    if (accessRoleId === undefined || accessRoleId === null || accessRoleId === "" || accessRoleId === "no role") {
        // hasn't been set, don't try to find a name for it
        console.log("No access role was set for the user on load");
		
		record.accessrole = "no role";
        Script.setForm("details", record);
		
		// if it was set to -1, then it was set to no role previously
    } else if (accessRoleId === 0) {
		console.log("access role was set to 0");
		record.accessrole = "no role";
        Script.setForm("details", record);
		
	} else {
		console.log("attempting to get the access role name");
        var filter = {
            columns: "Id, RoleName",
            filter: "Id=" + accessRoleId
        };
        Database.readRecords("rodent","UserAccessRole", function(eventData) {
			try {
				console.log("found the name for the access role");
                var accessRoleCollection = SensaCollection.load(eventData.value);
				var accessRoleName = accessRoleCollection.getFirst().RoleName;
				record.accessrole = accessRoleName;
                Script.setForm("details", record);
			} catch (error) {
				console.log("No access role found for the chosen access role id, please contact system admin");
				record.accessrole = "no role";
                Script.setForm("details", record);
			}
        },filter);
    }
    
}


function populateAllUserAccessRoles() {
    	// Populate the Access Roles dropdown
	var defaultRoleData = {
		"text": "no role",
		"value": 0
	};
	
    // set the filter to read the user roles table
    var UserRolesFilter = {
        columns: "Id,User, CompanyId",
        filter: 'User="' + Client.getUser() + '" and IsPrimary=1'
    };
	
	var accessDrop = Script.getWidget("accessRole");
	
    Database.readRecords("rodent", "UserRoles", function(eventData) {
        var CompanyId = eventData.value.getColumn("CompanyId");
        // set the filter to read the user access roles table
        var UserAccessRolesFilter = {
            columns: "RoleName,ID",
            filter: "CompanyId = " + CompanyId
        };
        //console.log("User access roles filter: " + JSON.stringify(UserAccessRolesFilter, null, 4));
        Database.readRecords("rodent", "UserAccessRole", function(eventData) {
            try{
                // need to make a sensacollection containing the RoleName and ID, with the headers "text" and "value"
                var accessRolesCollection = SensaCollection.load(eventData.value);
                accessRolesCollection.setColumns(["text","value"]);

                accessRolesCollection.add(defaultRoleData);
                accessDrop.receiveTextValues(accessRolesCollection);
            } catch (error) {
                // if there was an error, then it was unable to find  a name for the chosen id. So just populate it with the default user role
				console.log("error with trying to set default access role");
                var accessRolesCollection = new SensaCollection(["text","value"], "text");
                accessRolesCollection.add(defaultRoleData);
                accessDrop.receiveTextValues(accessRolesCollection);
            }
        }, UserAccessRolesFilter);

    }, UserRolesFilter);
}