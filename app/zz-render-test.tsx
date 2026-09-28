// TEMPORARY render test - delete
import ParagraphContent from "@/components/ParagraphContent";
import React from "react";
import { ScrollView, View } from "react-native";

const HTML = "<p style=\"text-align:center;\"><span style=\"font-family:Lato, sans-serif;font-size:28px;\"><strong>Lorem Ipsum</strong></span></p><p style=\"margin-left:0px;text-align:justify;\"><span style=\"font-family:'Dancing Script', cursive;font-size:24px;\"><strong>&nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</strong></span><a href=\"https://app.ikigaijobplacement.com/\"><span style=\"font-family:'Dancing Script', cursive;font-size:28px;\"><strong>Lorem ipsum</strong></span></a> dolor sit amet, consectetur adipiscing elit. Curabitur lacinia porta quam ac vulputate. Quisque metus risus, tincidunt sit amet est sit amet, finibus ultricies quam. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin tincidunt velit nec magna posuere vulputate. Maecenas fermentum odio rhoncus dapibus dapibus. Pellentesque finibus enim nec pellentesque sagittis. Maecenas ligula diam, pretium et venenatis a, malesuada et felis. Aenean lectus ipsum, aliquam sit amet hendrerit ut, vulputate consectetur mauris. Nullam facilisis, mauris nec eleifend accumsan, risus quam cursus ex, ac maximus nunc est vitae justo. Nunc interdum libero quis orci vulputate convallis.</p><p style=\"margin-left:0px;text-align:justify;\">&nbsp;</p><p style=\"margin-left:0px;text-align:justify;\">Cras a luctus sapien, vitae blandit erat. Phasellus feugiat erat rhoncus purus facilisis, non bibendum odio rhoncus. Nulla ac ante a justo volutpat dapibus vitae ac metus. Etiam aliquet diam quis dolor congue, eget vulputate ipsum finibus. Cras volutpat urna ut nisi blandit fringilla. Sed gravida at sapien at semper. Donec blandit tortor id elit finibus, nec egestas elit iaculis. Suspendisse rutrum faucibus congue. Donec sagittis arcu vel commodo varius. Curabitur ultrices fringilla tellus in molestie. Donec porta turpis sem, ut vulputate erat efficitur pharetra. Sed mauris eros, tristique ut orci eu, dapibus vulputate eros. Cras finibus aliquam tortor, sed lobortis sapien vestibulum eu. Pellentesque fringilla est ut metus tincidunt elementum. Nulla luctus urna sed neque sollicitudin, a aliquam tellus consequat.</p>";

export default function ZzRenderTest() {
  return (
    <ScrollView style={{ backgroundColor: "#f3f4f6" }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
        <ParagraphContent content={HTML} />
      </View>
    </ScrollView>
  );
}
