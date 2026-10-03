interface Weather {
    city: string;
    temperature: number;
    condition: string; // fix: primitive types in TS must be lowercase, credits to w3schools. 
}
// Essentially a blueprint that says any weather object must look like this.


// exporting the mock data so that it can be used in other files.
export const mockWeatherData: Weather[] = [
    {
        city: "London",
        temperature: 14,
        condition: "Rainy"
    },
    
    {
        city: "Madrid",
        temperature: 34,
        condition: "Sunny"
    },

    {
        city: "Paris",
        temperature: 20,
        condition: "Cloudy"
    },

    {
        city: "Seoul",
        temperature: 2,
        condition: "Snowy"
    },

    {
        city: "New York",
        temperature: 9,
        condition: "Windy"
    }
] // 5 mock data objects created with different conditions.