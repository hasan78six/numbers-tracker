import CompaniesForm from './CompaniesForm'
import CompaniesFilter from './CompaniesFilter'

const CompaniesActionTools = () => {
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <CompaniesFilter />
            <CompaniesForm />
        </div>
    )
}

export default CompaniesActionTools
