const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function gatherData(jobTitles){
    let results = {total: 0, values: []}

    const site = `https://www.cwjobs.co.uk/jobs/in-south-east`
    const total = await numberOfJobs(site) //Gets all jobs listed for a total so can work out percentage
    results.total = total

    for (const title of jobTitles) { //Iterate over all keywords in POST body getting number of ads
        const site = `https://www.cwjobs.co.uk/jobs/${title}/in-south-east`
        const result = await numberOfJobs(site)
        results.values.push( {label: title, value: result} ) //Calc the percentage of jobs with this keyword
    }

    return results
}

async function numberOfJobs (address) {
    //Gather data from site and add to a DOM
    const dom = await JSDOM.fromURL(address)
    //Find total jobs listed from page, is contained in <span class="at-facet-header-total-results">20</span>
    const element = dom.window.document.querySelector('span.at-facet-header-total-results')
    try{
        return parseInt(element.innerHTML.replace(/,/g, ''))
    } catch {
        return 0
    }
}

export default (req, res) => {
    try{ //Added to try so can catch any api calls without a .titles in the POST body
        const jobTitles = req.body.titles
        gatherData(jobTitles)
        .then(data => {
            res.status(200).json(data)
        })
        .catch(error => res.status(500).json({error: error}))
    } catch {
        res.status(500)
    }
  }