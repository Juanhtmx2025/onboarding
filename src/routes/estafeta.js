const fs = require('fs');
const zlib = require('zlib');
const convertCsvToXlsx = require('@aternus/csv-to-xlsx');
const api_successfactors = require("../services/api_successfactors");
const api_pi = require("../services/api_personality");
const pi = require("../helpers/personality-insights");
const moment =  require('moment');

exports.search = async (req, res) => {
  
  let filter = "nationalIdNav/cardType eq 'PR' and nationalIdNav/nationalId eq '" + req.body.curp + "'";
  var response = await api_successfactors.getPersonIdExt(filter);
  
  if (response.status !== 200)
    return res.status(422).json({
      message: 'Ocurrio un problema con la busqueda, intentalo nuevamente.'
    });
  if (response.data.d.results.length <= 0)
    return res.status(422).json({
      message: 'Tu CURP no se encuentra para realizar la encuesta.'
    });

  let external_code = response.data.d.results[0].personIdExternal;
  let full_name = response.data.d.results[0].personalInfoNav.results[0].displayName;

  response = await api_successfactors.getOnbKeys(external_code);
  
  if (response.status !== 200)
    return res.status(422).json({
      message: 'Ocurrio un problema con la busqueda, intentalo nuevamente.'
    });
  if (response.data.d.results.length > 0)
    return res.status(422).json({
      message: 'La encuesta para este CURP ya fue contestada.'
    });

  return res.json({
    message: 'Encontrado!',
    external_code: external_code,
    full_name: full_name,
  });
};

exports.store = async (req, res) => {

  var external_code = req.body.external_code;

  let host = req.protocol + "://" + req.headers.host;
  let result = await storeAttachment(req.body.comments, host);

  if (result.status !== 200)
    return res.status(422).json({
      message: 'Ocurrio un problema al guardar la encuesta (1), intentelo nuevamente!'
    });
  if (result.data.d[0].httpCode !== 200)
    return res.status(422).json({
      message: 'Ocurrio un problema al guardar la encuesta (2), intentelo más tarde!'
    });

  let attachment_id = result.data.d[0].key.split("/", 2)[1];
  let result2 = await storeAnswers(external_code, attachment_id, req.body);

  if (result2.status !== 200)
    return res.status(422).json({
      message: 'Ocurrio un problema al guardar la encuesta (3), intentelo nuevamente!'
    });
  if (result2.data.d[0].httpCode !== 200)
    return res.status(422).json({
      message: 'Ocurrio un problema al guardar la encuesta (4), intentelo más tarde!'
    });

  return res.json({
    message: 'Encuesta enviada correctamente, gracias por tu colaboración!'
  });
};

async function storeAnswers(external_code, attachment_id, data) {
  const moment = require('moment');
  let date_now = moment().format('YYYY-MM-DDTHH:mm:ss');

  let form = {
    "__metadata": {
      "uri": "cust_Claves_ONB(effectiveStartDate=datetime'" + date_now + "',externalCode='" + external_code + "')"
    },
    "cust_curso_induccion": strToBool(data.q1),
    "cust_proposito_superior": strToBool(data.q2),
    "cust_valores_organizacionales": strToBool(data.q3),
    "cust_priorizacion_valores": strToBool(data.q4),
    "cust_herramientas_necesarias": strToBool(data.q5),
    "cust_apoyo_lider": strToBool(data.q6),
    "cust_respeto_colaboracion": strToBool(data.q7),
    "cust_clara_idea": strToBool(data.q8),    
    "cust_reclutamiento_seleccion": data.q10,
    "cust_proceso_bienvenida": data.q11,
    "cust_Comentarios_adicionales": data.comments,
    "cust_Carga_documentoNav": {
      "__metadata": { "uri": "Attachment(" + attachment_id + ")" }
    }
  };

  console.log("🧪 Formulario enviado a SuccessFactors:");
  console.log(JSON.stringify(form, null, 2));

  const response = await api_successfactors.storeAnswers(form);

  console.log("📬 Respuesta de SuccessFactors:");
  console.log(JSON.stringify(response.data, null, 2));

  return response;
}

async function storeAttachment(text, host) {
  var filename = 'pi_' + Date.now() + '.pdf';
  var path = 'storage/' + filename;
  if (!fs.existsSync('./storage')) fs.mkdirSync('./storage');

  await pi.getPDF(text, host, path);

  const stats = fs.statSync(path);
  console.log("📎 PDF generado:", filename);
  console.log("📎 Tamaño:", stats.size, "bytes");

  var contents = fs.readFileSync(path, { encoding: 'base64' });
  console.log("📎 Archivo base64 (primeros 100):", contents.slice(0, 100) + "...");

  let form = [{
    "__metadata": { "uri": "Attachment" },
    "fileContent": contents,
    "fileName": filename,
    "module": "GENERIC_OBJECT",
    "userId": "sysAPI",
    "ownerIdType": "NOT_PROVIDED",
    "ownerId": "noOwner",
    "description": "Análisis de personalidad"
  }];

  const response = await api_successfactors.storeAttachment(form);

  fs.unlinkSync(path);
  return response;
}


function strToBool(s)
{
  return s === 'true' ? true : false;
}