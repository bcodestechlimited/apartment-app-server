import connectDB from "@/config/connectDB";
import Property from "@/modules/property/property.model";

const modifyProperties = async () => {
  await connectDB();

  const properties = await Property.find({});

  for (const property of properties) {
    const { availabilityDate } = property;

    // Skip if already a Date
    if (availabilityDate instanceof Date) continue;

    // Skip if empty or invalid string
    if (!availabilityDate || typeof availabilityDate !== "string") continue;

    const parsedDate = new Date(availabilityDate);

    if (isNaN(parsedDate.getTime())) {
      console.warn(
        `Invalid date string: ${availabilityDate} for property ID ${property._id}`
      );
      continue;
    }

    // Update and save
    property.availabilityDate = parsedDate;
    await property.save();
    console.log(
      `Updated property ${property._id} → availabilityDate: ${parsedDate}`
    );
  }

  console.log("Done updating all properties.");
  process.exit(0);
};

modifyProperties().catch(console.error);
