import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import updateLocale from "dayjs/plugin/updateLocale";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);
dayjs.locale("pt-br");
// Semana começa na segunda (grade seg–sex da agenda).
dayjs.updateLocale("pt-br", { weekStart: 1 });

export default dayjs;
