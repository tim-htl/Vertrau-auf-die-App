import { Button } from "@react-navigation/elements";
import { Text, View } from "react-native";

export default function Index() {
  const count = 0;
  
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Count: {count}</Text>
      
    </View>
  );
}
