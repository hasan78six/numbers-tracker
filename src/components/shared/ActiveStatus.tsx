import { GoCheckCircleFill } from "react-icons/go";
import { BsBanFill } from "react-icons/bs";

const ActiveStatus = ({ is_active }: { is_active: boolean }) => {
    if (is_active) {
        return <GoCheckCircleFill color='#10b981' size={20} />
    }
    return <BsBanFill color="#ff6a55" size={19} />
}

export default ActiveStatus
